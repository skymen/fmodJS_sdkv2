/**
 * FMODWrapper - A tag-based FMOD Studio API wrapper
 *
 * Manages FMOD events using string tags for easy grouping and control.
 * Multiple event instances can share tags, and actions on tags affect all matching instances.
 *
 * Usage:
 *   const fmod = new FMODWrapper();
 *   await fmod.initialize();
 *   await fmod.loadBank('Master.bank');
 *   await fmod.loadBank('Music.bank');
 *
 *   // Start events with tags
 *   const id = fmod.startEvent('event:/Music/Theme', 'music background', true);
 *
 *   // Control by tag (affects all matching instances)
 *   fmod.setEventParameter(null, 'music', 'intensity', false, 0.8);
 *
 *   // Control by ID (affects specific instance)
 *   fmod.stopEvent(null, id, true, true);
 */

let FMOD = null;

export default class FMODWrapper {
  constructor(_FMOD) {
    // FMOD system references
    this.system = null;
    this.coreSystem = null;
    this.initialized = false;
    FMOD = _FMOD;

    // Bank management
    this.banks = new Map(); // bankName -> { handle, loaded, loading }

    // Event instance tracking
    this.instances = new Map(); // instanceId -> { instance, name, tags: Set, released }
    this.tagIndex = new Map(); // tag -> Set of instanceIds
    this.nextInstanceId = 1;

    // Event description cache
    this.eventDescriptions = new Map(); // eventPath -> eventDescription
  }

  /**
   * Initialize the FMOD system
   * @param {Object} options - Configuration options
   * @param {number} options.maxChannels - Maximum virtual channels (default: 1024)
   * @param {number} options.dspBufferSize - DSP buffer size (default: 512)
   * @param {number} options.numBuffers - Number of buffers (default: 2)
   * @param {Object} options.advancedSettings - Advanced FMOD settings
   * @returns {Promise} Resolves when FMOD is initialized
   */
  initialize(options = {}) {
    const {
      maxChannels = 1024,
      dspBufferSize = 512,
      numBuffers = 2,
      advancedSettings = {},
    } = options;

    return new Promise((resolve, reject) => {
      if (this.initialized) {
        resolve();
        return;
      }

      // Check if FMOD global exists
      if (typeof FMOD === "undefined") {
        reject(
          new Error(
            "FMOD is not loaded. Include fmodstudio.js before using FMODWrapper."
          )
        );
        return;
      }

      const outval = {};
      let result;

      // Create Studio System
      result = FMOD.Studio_System_Create(outval);
      if (result !== FMOD.OK) {
        reject(
          new Error(
            `Failed to create FMOD Studio System: ${FMOD.ErrorString(result)}`
          )
        );
        return;
      }
      this.system = outval.val;

      // Get Core System
      result = this.system.getCoreSystem(outval);
      if (result !== FMOD.OK) {
        reject(
          new Error(`Failed to get Core System: ${FMOD.ErrorString(result)}`)
        );
        return;
      }
      this.coreSystem = outval.val;

      // Configure DSP buffer
      result = this.coreSystem.setDSPBufferSize(dspBufferSize, numBuffers);
      if (result !== FMOD.OK) {
        console.warn(
          `Failed to set DSP buffer size: ${FMOD.ErrorString(result)}`
        );
      }

      // Set software format based on driver info
      result = this.coreSystem.getDriverInfo(0, null, null, outval, null, null);
      if (result === FMOD.OK) {
        result = this.coreSystem.setSoftwareFormat(
          outval.val,
          FMOD.SPEAKERMODE_DEFAULT,
          0
        );
        if (result !== FMOD.OK) {
          console.warn(
            `Failed to set software format: ${FMOD.ErrorString(result)}`
          );
        }
      }

      // Apply advanced settings
      const defaultAdvancedSettings = {
        commandqueuesize: 10,
        handleinitialsize: 0,
        studioupdateperiod: 20,
        idlesampledatapoolsize: 0,
        streamingscheduledelay: 0,
      };
      result = this.system.setAdvancedSettings({
        ...defaultAdvancedSettings,
        ...advancedSettings,
      });
      if (result !== FMOD.OK) {
        console.warn(
          `Failed to set advanced settings: ${FMOD.ErrorString(result)}`
        );
      }

      // Initialize
      result = this.system.initialize(
        maxChannels,
        FMOD.STUDIO_INIT_NORMAL,
        FMOD.INIT_NORMAL,
        null
      );
      if (result !== FMOD.OK) {
        reject(
          new Error(`Failed to initialize FMOD: ${FMOD.ErrorString(result)}`)
        );
        return;
      }

      this.initialized = true;
      resolve();
    });
  }

  /**
   * Update FMOD - must be called regularly (e.g., every frame)
   */
  update() {
    if (!this.initialized || !this.system) return;

    // Clean up released/stopped instances
    this._cleanupInstances();

    // Update FMOD
    this.system.update();
  }

  /**
   * Clean up stopped or released instances
   * @private
   */
  _cleanupInstances() {
    const toRemove = [];

    for (const [id, data] of this.instances) {
      if (data.released) {
        toRemove.push(id);
        continue;
      }

      // Check if instance handle is still valid before accessing it
      if (!data.instance) {
        toRemove.push(id);
        continue;
      }

      // Check playback state
      const stateOut = {};
      const result = data.instance.getPlaybackState(stateOut);

      // If we get an error, the instance may have been released externally
      if (result !== FMOD.OK) {
        data.released = true;
        toRemove.push(id);
        continue;
      }

      if (stateOut.val === FMOD.STUDIO_PLAYBACK_STOPPED) {
        if (data.autoRelease) {
          data.instance.release();
          data.released = true;
          toRemove.push(id);
        }
      }
    }

    for (const id of toRemove) {
      this._removeInstance(id);
    }
  }

  /**
   * Remove an instance from tracking
   * @private
   */
  _removeInstance(id) {
    const data = this.instances.get(id);
    if (!data) return;

    // Remove from tag index
    for (const tag of data.tags) {
      const tagSet = this.tagIndex.get(tag);
      if (tagSet) {
        tagSet.delete(id);
        if (tagSet.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    }

    this.instances.delete(id);
  }

  /**
   * Get instances matching name and/or tag
   * @private
   * @param {string|null} name - Event name/path (null for any)
   * @param {string|number|null} tag - Tag string or instance ID (null for all)
   * @returns {Array} Array of { id, data } objects
   */
  _getMatchingInstances(name, tag) {
    const results = [];

    // If tag is a number, it's an instance ID
    if (typeof tag === "number") {
      const data = this.instances.get(tag);
      if (data && !data.released) {
        if (!name || data.name === name) {
          results.push({ id: tag, data });
        }
      }
      return results;
    }

    // If tag is a string, find all instances with that tag
    if (typeof tag === "string" && tag.trim()) {
      const tagSet = this.tagIndex.get(tag.trim());
      if (tagSet) {
        for (const id of tagSet) {
          const data = this.instances.get(id);
          if (data && !data.released) {
            if (!name || data.name === name) {
              results.push({ id, data });
            }
          }
        }
      }
      return results;
    }

    // No tag specified - get all instances (optionally filtered by name)
    for (const [id, data] of this.instances) {
      if (!data.released) {
        if (!name || data.name === name) {
          results.push({ id, data });
        }
      }
    }
    return results;
  }

  /**
   * Get or cache an event description
   * @private
   */
  _getEventDescription(name) {
    if (this.eventDescriptions.has(name)) {
      return this.eventDescriptions.get(name);
    }

    const outval = {};
    const result = this.system.getEvent(name, outval);
    if (result !== FMOD.OK) {
      console.error(
        `Failed to get event "${name}": ${FMOD.ErrorString(result)}`
      );
      return null;
    }

    this.eventDescriptions.set(name, outval.val);
    return outval.val;
  }

  // ==================== Bank Management ====================

  /**
   * Load a bank file
   * @param {string} bankName - Bank filename (e.g., 'Master.bank')
   * @returns {Promise} Resolves when bank is loaded
   */
  loadBank(bankName) {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      const existing = this.banks.get(bankName);
      if (existing) {
        if (existing.loaded) {
          resolve();
          return;
        }
        if (existing.loading) {
          // Wait for existing load operation
          existing.promise.then(resolve).catch(reject);
          return;
        }
      }

      // Start loading
      const bankData = {
        handle: null,
        loaded: false,
        loading: true,
        promise: null,
      };

      const loadPromise = new Promise((res, rej) => {
        const outval = {};
        const result = this.system.loadBankFile(
          "/" + bankName,
          FMOD.STUDIO_LOAD_BANK_NORMAL,
          outval
        );

        if (result !== FMOD.OK) {
          bankData.loading = false;
          rej(
            new Error(
              `Failed to load bank "${bankName}": ${FMOD.ErrorString(result)}`
            )
          );
          return;
        }

        bankData.handle = outval.val;
        bankData.loaded = true;
        bankData.loading = false;
        res();
      });

      bankData.promise = loadPromise;
      this.banks.set(bankName, bankData);

      loadPromise.then(resolve).catch(reject);
    });
  }

  /**
   * Unload a bank
   * @param {string} bankName - Bank filename
   * @returns {Promise} Resolves when bank is unloaded
   */
  unloadBank(bankName) {
    return new Promise((resolve, reject) => {
      const bankData = this.banks.get(bankName);

      if (!bankData || !bankData.handle) {
        resolve(); // Not loaded, nothing to do
        return;
      }

      const result = bankData.handle.unload();
      if (result !== FMOD.OK) {
        reject(
          new Error(
            `Failed to unload bank "${bankName}": ${FMOD.ErrorString(result)}`
          )
        );
        return;
      }

      this.banks.delete(bankName);

      // Clear cached event descriptions (they may become invalid)
      this.eventDescriptions.clear();

      resolve();
    });
  }

  /**
   * Unload all banks
   * @returns {Promise} Resolves when all banks are unloaded
   */
  unloadAllBanks() {
    const promises = [];
    for (const bankName of this.banks.keys()) {
      promises.push(this.unloadBank(bankName));
    }
    return Promise.all(promises);
  }

  // ==================== Event Creation ====================

  /**
   * Start a one-time (fire and forget) event
   * @param {string} name - Event path (e.g., 'event:/SFX/Explosion')
   * @returns {boolean} True if event was started successfully
   */
  startOneTimeEvent(name) {
    const desc = this._getEventDescription(name);
    if (!desc) return false;

    const instanceOut = {};
    let result = desc.createInstance(instanceOut);
    if (result !== FMOD.OK) {
      console.error(
        `Failed to create instance for "${name}": ${FMOD.ErrorString(result)}`
      );
      return false;
    }

    const instance = instanceOut.val;

    result = instance.start();
    if (result !== FMOD.OK) {
      console.error(
        `Failed to start instance for "${name}": ${FMOD.ErrorString(result)}`
      );
      instance.release();
      return false;
    }

    // Release immediately - FMOD will keep it alive until it finishes
    instance.release();
    return true;
  }

  /**
   * Instantiate an event without starting it
   * @param {string} name - Event path
   * @param {string} tags - Space-separated tags
   * @returns {number|null} Instance ID or null on failure
   */
  instantiateEvent(name, tags = "") {
    const desc = this._getEventDescription(name);
    if (!desc) return null;

    const instanceOut = {};
    const result = desc.createInstance(instanceOut);
    if (result !== FMOD.OK) {
      console.error(
        `Failed to create instance for "${name}": ${FMOD.ErrorString(result)}`
      );
      return null;
    }

    const instance = instanceOut.val;
    const id = this.nextInstanceId++;

    // Parse tags
    const tagSet = new Set();
    if (tags && typeof tags === "string") {
      tags
        .split(/\s+/)
        .filter((t) => t.trim())
        .forEach((t) => tagSet.add(t.trim()));
    }

    // Store instance data
    const data = {
      instance,
      name,
      tags: tagSet,
      released: false,
      autoRelease: false,
    };
    this.instances.set(id, data);

    // Update tag index
    for (const tag of tagSet) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag).add(id);
    }

    return id;
  }

  /**
   * Create and start an event
   * @param {string} name - Event path
   * @param {string} tags - Space-separated tags
   * @param {boolean} destroyWhenStopped - Auto-release when stopped
   * @returns {number|null} Instance ID or null on failure
   */
  startEvent(name, tags = "", destroyWhenStopped = true) {
    const id = this.instantiateEvent(name, tags);
    if (id === null) return null;

    const data = this.instances.get(id);
    data.autoRelease = destroyWhenStopped;

    const result = data.instance.start();
    if (result !== FMOD.OK) {
      console.error(
        `Failed to start event "${name}": ${FMOD.ErrorString(result)}`
      );
      data.instance.release();
      this._removeInstance(id);
      return null;
    }

    return id;
  }

  // ==================== Event Parameters ====================

  /**
   * Set a parameter on matching events
   * @param {string|null} name - Event name (null for any)
   * @param {string|number|null} tag - Tag or instance ID
   * @param {string|Object} param - Parameter name or ID
   * @param {boolean} isId - True if param is an ID object
   * @param {number} value - Parameter value
   * @param {boolean} ignoreSeekSpeed - Ignore seek speed
   */
  setEventParameter(name, tag, param, isId, value, ignoreSeekSpeed = false) {
    const instances = this._getMatchingInstances(name, tag);

    for (const { data } of instances) {
      let result;
      if (isId) {
        result = data.instance.setParameterByID(param, value, ignoreSeekSpeed);
      } else {
        result = data.instance.setParameterByName(
          param,
          value,
          ignoreSeekSpeed
        );
      }
      if (result !== FMOD.OK) {
        console.warn(
          `Failed to set parameter "${param}" on instance: ${FMOD.ErrorString(
            result
          )}`
        );
      }
    }
  }

  /**
   * Set a parameter with label on matching events
   * @param {string|null} name - Event name (null for any)
   * @param {string|number|null} tag - Tag or instance ID
   * @param {string|Object} param - Parameter name or ID
   * @param {boolean} isId - True if param is an ID object
   * @param {string} label - Label value
   * @param {boolean} ignoreSeekSpeed - Ignore seek speed
   */
  setEventParameterWithLabel(
    name,
    tag,
    param,
    isId,
    label,
    ignoreSeekSpeed = false
  ) {
    const instances = this._getMatchingInstances(name, tag);

    for (const { data } of instances) {
      let result;
      if (isId) {
        result = data.instance.setParameterByIDWithLabel(
          param,
          label,
          ignoreSeekSpeed
        );
      } else {
        result = data.instance.setParameterByNameWithLabel(
          param,
          label,
          ignoreSeekSpeed
        );
      }
      if (result !== FMOD.OK) {
        console.warn(
          `Failed to set parameter "${param}" with label on instance: ${FMOD.ErrorString(
            result
          )}`
        );
      }
    }
  }

  /**
   * Set a global parameter
   * @param {string|Object} param - Parameter name or ID
   * @param {boolean} isId - True if param is an ID object
   * @param {number} value - Parameter value
   * @param {boolean} ignoreSeekSpeed - Ignore seek speed
   */
  setGlobalParameter(param, isId, value, ignoreSeekSpeed = false) {
    let result;
    if (isId) {
      result = this.system.setParameterByID(param, value, ignoreSeekSpeed);
    } else {
      result = this.system.setParameterByName(param, value, ignoreSeekSpeed);
    }
    if (result !== FMOD.OK) {
      console.warn(
        `Failed to set global parameter "${param}": ${FMOD.ErrorString(result)}`
      );
    }
  }

  /**
   * Set a global parameter with label
   * @param {string|Object} param - Parameter name or ID
   * @param {boolean} isId - True if param is an ID object
   * @param {string} label - Label value
   * @param {boolean} ignoreSeekSpeed - Ignore seek speed
   */
  setGlobalParameterWithLabel(param, isId, label, ignoreSeekSpeed = false) {
    let result;
    if (isId) {
      result = this.system.setParameterByIDWithLabel(
        param,
        label,
        ignoreSeekSpeed
      );
    } else {
      result = this.system.setParameterByNameWithLabel(
        param,
        label,
        ignoreSeekSpeed
      );
    }
    if (result !== FMOD.OK) {
      console.warn(
        `Failed to set global parameter "${param}" with label: ${FMOD.ErrorString(
          result
        )}`
      );
    }
  }

  // ==================== Event Control ====================

  /**
   * Stop matching events
   * @param {string|null} name - Event name (null for any)
   * @param {string|number|null} tag - Tag or instance ID
   * @param {boolean} allowFadeOut - Allow fade out
   * @param {boolean} release - Release after stopping
   */
  stopEvent(name, tag, allowFadeOut = true, release = true) {
    const instances = this._getMatchingInstances(name, tag);
    const stopMode = allowFadeOut
      ? FMOD.STUDIO_STOP_ALLOWFADEOUT
      : FMOD.STUDIO_STOP_IMMEDIATE;

    for (const { id, data } of instances) {
      const result = data.instance.stop(stopMode);
      if (result !== FMOD.OK) {
        console.warn(`Failed to stop instance: ${FMOD.ErrorString(result)}`);
      }

      if (release) {
        data.instance.release();
        data.released = true;
      }
    }
  }

  /**
   * Stop all instances of a specific event
   * @param {string} name - Event name
   * @param {boolean} allowFadeOut - Allow fade out
   * @param {boolean} release - Release after stopping
   */
  stopAllEventInstances(name, allowFadeOut = true, release = true) {
    this.stopEvent(name, null, allowFadeOut, release);
  }

  /**
   * Stop all event instances
   * @param {boolean} allowFadeOut - Allow fade out
   * @param {boolean} release - Release after stopping
   */
  stopAllEvents(allowFadeOut = true, release = true) {
    this.stopEvent(null, null, allowFadeOut, release);
  }

  /**
   * Release all instances of a specific event
   * @param {string} name - Event name
   */
  releaseAllEventInstances(name) {
    const instances = this._getMatchingInstances(name, null);

    for (const { data } of instances) {
      if (!data.released) {
        data.instance.release();
        data.released = true;
      }
    }
  }

  /**
   * Set paused state on matching events
   * @param {string|null} name - Event name (null for any)
   * @param {string|number|null} tag - Tag or instance ID
   * @param {boolean} paused - Paused state
   */
  setEventPaused(name, tag, paused) {
    const instances = this._getMatchingInstances(name, tag);

    for (const { data } of instances) {
      const result = data.instance.setPaused(paused);
      if (result !== FMOD.OK) {
        console.warn(`Failed to set paused state: ${FMOD.ErrorString(result)}`);
      }
    }
  }

  /**
   * Set timeline position on matching events
   * @param {string|null} name - Event name (null for any)
   * @param {string|number|null} tag - Tag or instance ID
   * @param {number} position - Position in milliseconds
   */
  setEventTimelinePosition(name, tag, position) {
    const instances = this._getMatchingInstances(name, tag);

    for (const { data } of instances) {
      const result = data.instance.setTimelinePosition(position);
      if (result !== FMOD.OK) {
        console.warn(
          `Failed to set timeline position: ${FMOD.ErrorString(result)}`
        );
      }
    }
  }

  /**
   * Wait for matching events to stop
   * @param {string|null} name - Event name (null for any)
   * @param {string|number|null} tag - Tag or instance ID
   * @returns {Promise} Resolves when all matching events have stopped
   */
  waitForEventStop(name, tag) {
    const instances = this._getMatchingInstances(name, tag);

    if (instances.length === 0) {
      return Promise.resolve();
    }

    return Promise.all(
      instances.map(({ data }) => {
        return new Promise((resolve) => {
          const result = data.instance.setCallback(
            () => resolve(),
            FMOD.STUDIO_EVENT_CALLBACK_STOPPED
          );
          if (result !== FMOD.OK) {
            console.warn(
              `Failed to set callback for waitForEventStop: ${FMOD.ErrorString(
                result
              )}`
            );
            resolve(); // Resolve anyway to avoid hanging
          }
        });
      })
    );
  }

  // ==================== 3D Positioning ====================

  /**
   * Set 3D attributes on matching events
   * @param {string|null} name - Event name (null for any)
   * @param {string|number|null} tag - Tag or instance ID
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {number} z - Position Z
   * @param {number} vx - Velocity X
   * @param {number} vy - Velocity Y
   * @param {number} vz - Velocity Z
   * @param {number} fx - Forward X
   * @param {number} fy - Forward Y
   * @param {number} fz - Forward Z
   * @param {number} ux - Up X
   * @param {number} uy - Up Y
   * @param {number} uz - Up Z
   */
  setEvent3DAttributes(name, tag, x, y, z, vx, vy, vz, fx, fy, fz, ux, uy, uz) {
    const instances = this._getMatchingInstances(name, tag);

    const attributes = FMOD._3D_ATTRIBUTES();
    attributes.position.x = x;
    attributes.position.y = y;
    attributes.position.z = z;
    attributes.velocity.x = vx;
    attributes.velocity.y = vy;
    attributes.velocity.z = vz;
    attributes.forward.x = fx;
    attributes.forward.y = fy;
    attributes.forward.z = fz;
    attributes.up.x = ux;
    attributes.up.y = uy;
    attributes.up.z = uz;

    for (const { data } of instances) {
      const result = data.instance.set3DAttributes(attributes);
      if (result !== FMOD.OK) {
        console.warn(
          `Failed to set 3D attributes: ${FMOD.ErrorString(result)}`
        );
      }
    }
  }

  /**
   * Set listener 3D attributes
   * @param {number} id - Listener index
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {number} z - Position Z
   * @param {number} vx - Velocity X
   * @param {number} vy - Velocity Y
   * @param {number} vz - Velocity Z
   * @param {number} fx - Forward X
   * @param {number} fy - Forward Y
   * @param {number} fz - Forward Z
   * @param {number} ux - Up X
   * @param {number} uy - Up Y
   * @param {number} uz - Up Z
   * @param {boolean} hasSeparateAttenuationPosition - Has separate attenuation position
   * @param {number} ax - Attenuation position X
   * @param {number} ay - Attenuation position Y
   * @param {number} az - Attenuation position Z
   */
  setListener3DAttributes(
    id,
    x,
    y,
    z,
    vx,
    vy,
    vz,
    fx,
    fy,
    fz,
    ux,
    uy,
    uz,
    hasSeparateAttenuationPosition = false,
    ax = 0,
    ay = 0,
    az = 0
  ) {
    const attributes = FMOD._3D_ATTRIBUTES();
    attributes.position.x = x;
    attributes.position.y = y;
    attributes.position.z = z;
    attributes.velocity.x = vx;
    attributes.velocity.y = vy;
    attributes.velocity.z = vz;
    attributes.forward.x = fx;
    attributes.forward.y = fy;
    attributes.forward.z = fz;
    attributes.up.x = ux;
    attributes.up.y = uy;
    attributes.up.z = uz;

    let attenuationPosition = null;
    if (hasSeparateAttenuationPosition) {
      attenuationPosition = FMOD.VECTOR();
      attenuationPosition.x = ax;
      attenuationPosition.y = ay;
      attenuationPosition.z = az;
    }

    const result = this.system.setListenerAttributes(
      id,
      attributes,
      attenuationPosition
    );
    if (result !== FMOD.OK) {
      console.warn(
        `Failed to set listener ${id} attributes: ${FMOD.ErrorString(result)}`
      );
    }
  }

  /**
   * Set listener weight
   * @param {number} id - Listener index
   * @param {number} weight - Weight value (0.0 to 1.0)
   */
  setListenerWeight(id, weight) {
    const result = this.system.setListenerWeight(id, weight);
    if (result !== FMOD.OK) {
      console.warn(
        `Failed to set listener ${id} weight: ${FMOD.ErrorString(result)}`
      );
    }
  }

  /**
   * Set number of listeners
   * @param {number} nb - Number of listeners
   */
  setNbListeners(nb) {
    const result = this.system.setNumListeners(nb);
    if (result !== FMOD.OK) {
      console.warn(
        `Failed to set number of listeners: ${FMOD.ErrorString(result)}`
      );
    }
  }

  // ==================== Bus Control ====================

  /**
   * Get a bus handle
   * @private
   */
  _getBus(busPath) {
    const outval = {};
    const result = this.system.getBus(busPath, outval);
    if (result !== FMOD.OK) {
      console.warn(
        `Failed to get bus "${busPath}": ${FMOD.ErrorString(result)}`
      );
      return null;
    }
    return outval.val;
  }

  /**
   * Set bus muted state
   * @param {string} bus - Bus path (e.g., 'bus:/Music')
   * @param {boolean} muted - Muted state
   */
  setBusMuted(bus, muted) {
    const busHandle = this._getBus(bus);
    if (!busHandle) return;

    const result = busHandle.setMute(muted);
    if (result !== FMOD.OK) {
      console.warn(
        `Failed to set bus "${bus}" muted: ${FMOD.ErrorString(result)}`
      );
    }
  }

  /**
   * Set bus volume
   * @param {string} bus - Bus path
   * @param {number} volume - Volume (0.0 to 1.0)
   */
  setBusVolume(bus, volume) {
    const busHandle = this._getBus(bus);
    if (!busHandle) return;

    const result = busHandle.setVolume(volume);
    if (result !== FMOD.OK) {
      console.warn(
        `Failed to set bus "${bus}" volume: ${FMOD.ErrorString(result)}`
      );
    }
  }

  /**
   * Set bus paused state
   * @param {string} bus - Bus path
   * @param {boolean} paused - Paused state
   */
  setBusPaused(bus, paused) {
    const busHandle = this._getBus(bus);
    if (!busHandle) return;

    const result = busHandle.setPaused(paused);
    if (result !== FMOD.OK) {
      console.warn(
        `Failed to set bus "${bus}" paused: ${FMOD.ErrorString(result)}`
      );
    }
  }

  /**
   * Stop all events on a bus
   * @param {string} bus - Bus path
   */
  stopAllBusEvents(bus) {
    const busHandle = this._getBus(bus);
    if (!busHandle) return;

    const result = busHandle.stopAllEvents(FMOD.STUDIO_STOP_ALLOWFADEOUT);
    if (result !== FMOD.OK) {
      console.warn(
        `Failed to stop all events on bus "${bus}": ${FMOD.ErrorString(result)}`
      );
    }
  }

  // ==================== VCA Control ====================

  /**
   * Get a VCA handle
   * @private
   */
  _getVCA(vcaPath) {
    const outval = {};
    const result = this.system.getVCA(vcaPath, outval);
    if (result !== FMOD.OK) {
      console.warn(
        `Failed to get VCA "${vcaPath}": ${FMOD.ErrorString(result)}`
      );
      return null;
    }
    return outval.val;
  }

  /**
   * Set VCA volume
   * @param {string} vca - VCA path (e.g., 'vca:/Music')
   * @param {number} volume - Volume (0.0 to 1.0)
   */
  setVCAVolume(vca, volume) {
    const vcaHandle = this._getVCA(vca);
    if (!vcaHandle) return;

    const result = vcaHandle.setVolume(volume);
    if (result !== FMOD.OK) {
      console.warn(
        `Failed to set VCA "${vca}" volume: ${FMOD.ErrorString(result)}`
      );
    }
  }

  // ==================== System Control ====================

  /**
   * Set suspended state (suspend/resume mixer)
   * @param {boolean} suspended - Suspended state
   */
  setSuspended(suspended) {
    if (!this.coreSystem) return;

    let result;
    if (suspended) {
      result = this.coreSystem.mixerSuspend();
    } else {
      result = this.coreSystem.mixerResume();
    }

    if (result !== FMOD.OK) {
      console.warn(
        `Failed to set suspended state: ${FMOD.ErrorString(result)}`
      );
    }
  }

  /**
   * Resume audio (for iOS/Chrome workaround)
   * Handles OutputAudioWorklet resumption and mixer suspend/resume
   */
  resumeAudio() {
    if (!this.initialized || !this.coreSystem) return;

    try {
      // Call OutputAudioWorklet_resumeAudio if available
      if (typeof FMOD["OutputAudioWorklet_resumeAudio"] === "function") {
        FMOD["OutputAudioWorklet_resumeAudio"]();
      }

      // Suspend and resume mixer to kick the audio context
      this.coreSystem.mixerSuspend();
      this.coreSystem.mixerResume();
    } catch (error) {
      console.warn("Failed to resume audio:", error);
    }
  }

  /**
   * Set up audio resume handlers for iOS/Chrome workaround
   * Sets up event listeners that resume audio on user interaction
   */
  setupAudioResumeHandlers() {
    let audioResumed = false;
    // Listen to various user interaction events
    const interactionEvents = [
      "click",
      "touchstart",
      "keydown",
      "mousedown",
      "mouseup",
      "touchend",
      "touchcancel",
    ];

    const resumeOnInteraction = (real = true) => {
      if (!audioResumed && this.initialized) {
        this.resumeAudio();
        if (real) {
          audioResumed = true;
          // Mark FMOD as having received input
          if (FMOD) {
            FMOD.mInputRegistered = true;
          }
          // Remove all listeners after first real interaction
          interactionEvents.forEach((eventType) => {
            document.removeEventListener(eventType, resumeOnInteraction);
          });
        }
      }
    };

    interactionEvents.forEach((eventType) => {
      document.addEventListener(eventType, resumeOnInteraction, { once: true });
    });

    // Attempt initial resume
    resumeOnInteraction(false);
  }

  // ==================== Utility Methods ====================

  /**
   * Add tags to an existing instance
   * @param {number} id - Instance ID
   * @param {string} tags - Space-separated tags to add
   */
  addTags(id, tags) {
    const data = this.instances.get(id);
    if (!data) return;

    const newTags = tags.split(/\s+/).filter((t) => t.trim());
    for (const tag of newTags) {
      const trimmed = tag.trim();
      if (!data.tags.has(trimmed)) {
        data.tags.add(trimmed);
        if (!this.tagIndex.has(trimmed)) {
          this.tagIndex.set(trimmed, new Set());
        }
        this.tagIndex.get(trimmed).add(id);
      }
    }
  }

  /**
   * Remove tags from an existing instance
   * @param {number} id - Instance ID
   * @param {string} tags - Space-separated tags to remove
   */
  removeTags(id, tags) {
    const data = this.instances.get(id);
    if (!data) return;

    const tagsToRemove = tags.split(/\s+/).filter((t) => t.trim());
    for (const tag of tagsToRemove) {
      const trimmed = tag.trim();
      if (data.tags.has(trimmed)) {
        data.tags.delete(trimmed);
        const tagSet = this.tagIndex.get(trimmed);
        if (tagSet) {
          tagSet.delete(id);
          if (tagSet.size === 0) {
            this.tagIndex.delete(trimmed);
          }
        }
      }
    }
  }

  /**
   * Get all instance IDs with a specific tag
   * @param {string} tag - Tag to search for
   * @returns {Array<number>} Array of instance IDs
   */
  getInstancesByTag(tag) {
    const tagSet = this.tagIndex.get(tag);
    return tagSet ? Array.from(tagSet) : [];
  }

  /**
   * Get all active instance IDs
   * @returns {Array<number>} Array of instance IDs
   */
  getAllInstances() {
    return Array.from(this.instances.keys()).filter(
      (id) => !this.instances.get(id).released
    );
  }

  /**
   * Get instance info
   * @param {number} id - Instance ID
   * @returns {Object|null} Instance info or null
   */
  getInstanceInfo(id) {
    const data = this.instances.get(id);
    if (!data || data.released) return null;

    return {
      id,
      name: data.name,
      tags: Array.from(data.tags),
      autoRelease: data.autoRelease,
    };
  }

  /**
   * Check if an instance is playing
   * @param {number} id - Instance ID
   * @returns {boolean} True if playing
   */
  isPlaying(id) {
    const data = this.instances.get(id);
    if (!data || data.released) return false;

    const stateOut = {};
    const result = data.instance.getPlaybackState(stateOut);
    if (result !== FMOD.OK) return false;

    return (
      stateOut.val === FMOD.STUDIO_PLAYBACK_PLAYING ||
      stateOut.val === FMOD.STUDIO_PLAYBACK_STARTING ||
      stateOut.val === FMOD.STUDIO_PLAYBACK_SUSTAINING
    );
  }

  /**
   * Release the FMOD system
   */
  release() {
    if (this.system) {
      this.stopAllEvents(false, true);
      this.unloadAllBanks();
      this.system.release();
      this.system = null;
      this.coreSystem = null;
      this.initialized = false;
    }
  }
}
