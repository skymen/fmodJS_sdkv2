export default function (parentClass) {
  return class FMODManager extends parentClass {
    //====================================================================
    // Constructor
    //====================================================================
    constructor(iRuntime) {
      super(iRuntime);

      // FMOD Configuration
      this.FMOD = {};
      this.FMOD["preRun"] = this.preRun.bind(this);
      this.FMOD["onRuntimeInitialized"] = this.onRuntimeInitialized.bind(this);
      this.FMOD["INITIAL_MEMORY"] = 80 * 1024 * 1024;

      // State variables
      this.gWantSampleLoad = true;
      this.lastSuspendTime = 0;
      this._preRunCallbacks = [];
      this._initCallbacks = [];

      // Audio resources tracking
      this.banks = [];
      this.events = {};
      this.buses = {};
      this.vcas = {};
      this.banksByName = new Map();
      this.banksByPath = new Map();

      // Scheduling
      this.nextTickArray = [];

      // Initialize handlers
      this.SetUpDOMHandlers();
    }

    //====================================================================
    // Initialization Methods
    //====================================================================

    SetUpDOMHandlers() {
      this.AddRuntimeMessageHandlers([
        ["pre-init", (config) => this.PreInit(config)],
        [
          "pre-init-load-bank",
          ([path, preload, nonBlocking, name, url]) =>
            this.PreInitLoadBank(path, preload, nonBlocking, name, url),
        ],
        ["start-one-time-event", ([event]) => this.startOneTimeEvent(event)],
        ["update", () => this.update()],
        ["load-bank", ([name]) => this.loadBank(name)],
        ["unload-bank", ([name]) => this.unloadBank(name)],
        ["unload-all-banks", () => this.unloadAllBanks()],
        [
          "instantiate-event",
          ([name, tags]) => this.instantiateEvent(name, tags),
        ],
        [
          "start-event",
          ([name, tag, destroyWhenStopped]) =>
            this.startEvent(name, tag, destroyWhenStopped),
        ],
        [
          "set-event-parameter",
          ([name, tag, param, value, ignoreSeekSpeed, isId = false]) =>
            this.setEventParameter(
              name,
              tag,
              param,
              isId,
              value,
              ignoreSeekSpeed
            ),
        ],
        [
          "set-event-parameter-with-label",
          ([name, tag, param, value, ignoreSeekSpeed, isId = false]) =>
            this.setEventParameterWithLabel(
              name,
              tag,
              param,
              isId,
              value,
              ignoreSeekSpeed
            ),
        ],
        [
          "set-global-parameter",
          ([param, value, ignoreSeekSpeed, isId = false]) =>
            this.setGlobalParameter(param, isId, value, ignoreSeekSpeed),
        ],
        [
          "set-global-parameter-with-label",
          ([param, value, ignoreSeekSpeed, isId = false]) =>
            this.setGlobalParameterWithLabel(
              param,
              isId,
              value,
              ignoreSeekSpeed
            ),
        ],
        [
          "stop-event",
          ([name, tag, allowFadeOut, release]) =>
            this.stopEvent(name, tag, allowFadeOut, release),
        ],
        [
          "stop-all-event-instances",
          ([name, allowFadeOut, release]) =>
            this.stopAllEventInstances(name, allowFadeOut, release),
        ],
        [
          "stop-all-events",
          ([name, allowFadeOut, release]) =>
            this.stopAllEvents(allowFadeOut, release),
        ],
        ["release-event", ([name, tag]) => this.releaseEvent(name, tag)],
        [
          "release-all-event-instances",
          ([name]) => this.releaseAllEventInstances(name),
        ],
        [
          "set-event-paused",
          ([name, tag, paused]) => this.setEventPaused(name, tag, paused),
        ],
        [
          "set-event-timeline-position",
          ([name, tag, position]) =>
            this.setEventTimelinePosition(name, tag, position),
        ],
        [
          "wait-for-event-stop",
          ([name, tag]) => this.waitForEventStop(name, tag),
        ],
        [
          "set-event-3d-attributes",
          ([name, tag, x, y, z, vx, vy, vz, fx, fy, fz, ux, uy, uz]) =>
            this.setEvent3DAttributes(
              name,
              tag,
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
              uz
            ),
        ],
        [
          "set-listener-3d-attributes",
          ([
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
            hasSeparateAttenuationPosition,
            ax,
            ay,
            az,
          ]) =>
            this.setListener3DAttributes(
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
              hasSeparateAttenuationPosition,
              ax,
              ay,
              az
            ),
        ],
        [
          "set-listener-weight",
          ([id, weight]) => this.setListenerWeight(id, weight),
        ],
        ["set-nb-listeners", ([nb]) => this.setNbListeners(nb)],
        ["set-bus-muted", ([bus, muted]) => this.setBusMuted(bus, muted)],
        ["set-bus-volume", ([bus, volume]) => this.setBusVolume(bus, volume)],
        ["set-bus-paused", ([bus, paused]) => this.setBusPaused(bus, paused)],
        ["stop-all-bus-events", ([bus]) => this.stopAllBusEvents(bus)],
        ["set-vca-volume", ([vca, volume]) => this.setVCAVolume(vca, volume)],
        [
          "set-suspended",
          ([suspended, time]) => this.setSuspended(suspended, time),
        ],
      ]);
    }

    PreInitLoadBank(path, preload, nonBlocking, name, url) {
      const bank = {
        path,
        preload,
        nonBlocking,
        name,
        url,
        loaded: false,
      };
      this.banks.push(bank);
      this.banksByName.set(name, bank);
      this.banksByPath.set(path, bank);
    }

    async WaitForPreloadBanks() {
      await Promise.all(
        this.banks.map(async (bank) => {
          if (bank.preload) {
            const promise = this.loadBank(bank);
            if (!bank.nonBlocking) await promise;
          }
        })
      );
    }

    PreInit(config) {
      this.advancedSettings = config.advancedSettings || {};
      return Promise.all([
        new Promise((resolve) => {
          this._preRunCallbacks.push(() => {
            resolve();
          });
          this.HandleInit();
        }),
        new Promise((resolve) => {
          this._initCallbacks.push(async () => {
            await this.WaitForPreloadBanks();
            resolve();
          });
        }),
      ]);
    }

    HandleInit() {
      if (!globalThis.FMODModule) {
        setTimeout(() => {
          this.HandleInit();
        }, 100);
        return;
      }
      globalThis.FMODModule(this.FMOD);
    }

    preRun() {
      this._preRunCallbacks.forEach((cb) => cb());
      this._preRunCallbacks = [];
    }

    onRuntimeInitialized() {
      // Initialize the system
      this.initSystem();

      // Set up iOS/Chrome workaround. Webaudio is not allowed to start unless screen is touched or button is clicked.
      const resumeAudio = (realTry = true) => {
        if (!this.gAudioResumed) {
          this.FMOD["OutputAudioWorklet_resumeAudio"]();
          this.assert(this.gSystemCore.mixerSuspend());
          this.assert(this.gSystemCore.mixerResume());
          if (realTry) {
            this.gAudioResumed = true;
          } else {
            this.FMOD.mInputRegistered = true;
          }
        }
      };

      const interactionEvents = [
        "click",
        "touchstart",
        "keydown",
        "mousedown",
        "mouseup",
        "touchend",
        "touchcancel",
      ];
      interactionEvents.forEach((event) => {
        document.addEventListener(event, (event) => {
          resumeAudio(true);
        });
      });

      this.assert(
        this.gSystem.setCallback(
          this.studioCallback.bind(this),
          this.FMOD.STUDIO_SYSTEM_CALLBACK_BANK_UNLOAD
        )
      );

      this._loaded = true;
      this._initCallbacks.forEach((cb) => cb());
      this._initCallbacks = [];

      resumeAudio(false);

      return this.FMOD.OK;
    }

    studioCallback(system, type, commanddata, userdata) {
      if (type === this.FMOD.STUDIO_SYSTEM_CALLBACK_BANK_UNLOAD) {
        const bank = commanddata;
        const outval = {};

        this.assert(bank.getUserData(outval));
        console.log("BANK_UNLOAD", outval);
      }
      return this.FMOD.OK;
    }

    initSystem() {
      const outval = {};

      this.assert(this.FMOD.Studio_System_Create(outval));
      this.gSystem = outval.val;
      this.assert(this.gSystem.getCoreSystem(outval));
      this.gSystemCore = outval.val;

      this.assert(this.gSystemCore.setDSPBufferSize(512, 2));
      this.assert(
        this.gSystemCore.getDriverInfo(0, null, null, outval, null, null)
      );
      this.assert(
        this.gSystemCore.setSoftwareFormat(
          outval.val,
          this.FMOD.SPEAKERMODE_DEFAULT,
          0
        )
      );

      const defaultAdvancedSettings = {
        commandqueuesize: 10,
        handleinitialsize: 0,
        studioupdateperiod: 20,
        idlesampledatapoolsize: 0,
        streamingscheduledelay: 0,
      };

      this.assert(
        this.gSystem.setAdvancedSettings({
          ...defaultAdvancedSettings,
          ...this.advancedSettings,
        })
      );

      this.assert(
        this.gSystem.initialize(
          1024,
          this.FMOD.STUDIO_INIT_NORMAL,
          this.FMOD.INIT_NORMAL,
          null
        )
      );
    }

    //====================================================================
    // Utility Methods
    //====================================================================

    nextTick(fn) {
      this.nextTickArray.push(fn);
    }

    update() {
      if (!this.banks || !this.gSystem || !this.gSystemCore) return;

      // Execute scheduled functions
      this.nextTickArray.forEach((fn) => fn());
      this.nextTickArray = [];

      // Update FMOD
      this.assert(this.gSystem.update());
    }

    assert(result) {
      if (result != this.FMOD.OK) {
        console.error("FMOD error:", this.FMOD.ErrorString(result));
        throw this.FMOD.ErrorString(result);
      }
    }

    async fetchUrlAsInt8Array(url) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        return new Int8Array(buffer);
      } catch (error) {
        console.error("Error fetching URL:", error);
      }
    }

    awaitBankLoadedState(bank, state) {
      return new Promise((resolve) => {
        const outval = {};
        bank.bankHandle.getLoadingState(outval);
        if (outval.val === state) {
          resolve();
          return;
        }

        let interval = setInterval(() => {
          bank.bankHandle.getLoadingState(outval);
          if (outval.val === state) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      });
    }

    //====================================================================
    // Component Initialization Methods
    //====================================================================

    initEvent(event) {
      if (this.events[event]) return true;

      const outval = {};
      this.assert(this.gSystem.getEvent(event, outval));

      if (outval.val && outval.val.createInstance) {
        this.events[event] = {
          description: outval.val,
          instance: new Map(),
          allInstances: [],
        };
        return true;
      }
      return false;
    }

    initBus(bus) {
      if (this.buses[bus]) return true;

      const outval = {};
      this.assert(this.gSystem.getBus(bus, outval));

      if (outval.val) {
        this.buses[bus] = outval.val;
        return true;
      }
      return false;
    }

    initVCA(vca) {
      if (this.vcas[vca]) return true;

      const outval = {};
      this.assert(this.gSystem.getVCA(vca, outval));

      if (outval.val) {
        this.vcas[vca] = outval.val;
        return true;
      }
      return false;
    }

    //====================================================================
    // Bank Management Methods
    //====================================================================

    async loadBank(bankOrName) {
      if (typeof bankOrName === "string") {
        bankOrName =
          this.banksByName.get(bankOrName) || this.banksByPath.get(bankOrName);
      }

      if (!bankOrName) {
        console.error("Bank not found.");
        return;
      }

      if (bankOrName.loaded) {
        return bankOrName;
      }

      const bankhandle = {};
      const memory = await this.fetchUrlAsInt8Array(bankOrName.url);
      const errno = this.gSystem.loadBankMemory(
        memory,
        memory.length,
        this.FMOD.STUDIO_LOAD_MEMORY,
        this.FMOD.STUDIO_LOAD_BANK_NORMAL,
        bankhandle
      );

      if (errno === this.FMOD.ERR_EVENT_ALREADY_LOADED) {
        console.error(
          "Bank already loaded. Make sure you're not loading the same bank twice under different names."
        );
        return bankOrName;
      }

      this.assert(errno);
      bankOrName.bankHandle = bankhandle.val;

      await this.awaitBankLoadedState(
        bankOrName,
        this.FMOD.STUDIO_LOADING_STATE_LOADED
      );

      bankOrName.loaded = true;
      return bankOrName;
    }

    async unloadBank(bankOrName) {
      if (typeof bankOrName === "string") {
        bankOrName =
          this.banksByName.get(bankOrName) || this.banksByPath.get(bankOrName);
      }

      if (!bankOrName) {
        console.error("Bank not found.");
        return;
      }

      if (!bankOrName.loaded) {
        return bankOrName;
      }

      this.assert(this.gSystem.unloadBank(bankOrName.bankHandle));

      await this.awaitBankLoadedState(
        bankOrName,
        this.FMOD.STUDIO_LOADING_STATE_UNLOADED
      );

      bankOrName.loaded = false;
      return bankOrName;
    }

    async unloadAllBanks() {
      await Promise.all(
        this.banks.map(async (bank) => {
          await this.unloadBank(bank);
        })
      );
    }

    //====================================================================
    // Event Management Methods
    //====================================================================

    instantiateEvent(event, tags) {
      if (!this.initEvent(event)) return;

      const outval = {};
      this.assert(this.events[event].description.createInstance(outval));

      const tagArr = tags.split(" ");
      tagArr.forEach((tag) => {
        if (!this.events[event].instance.has(tag)) {
          this.events[event].instance.set(tag, []);
        }
        this.events[event].instance.get(tag).push(outval.val);
        this.events[event].allInstances.push(outval.val);
      });
    }

    startEvent(event, tag, destroyWhenStopped) {
      if (!this.initEvent(event)) return;

      let instancesInTag = this.events[event].instance.get(tag);
      if (!instancesInTag || instancesInTag.length === 0) {
        this.instantiateEvent(event, tag);
        instancesInTag = this.events[event].instance.get(tag);
      }

      instancesInTag.forEach((instance) => {
        this.assert(instance.start());
        if (destroyWhenStopped) {
          this.assert(instance.release());
        }
      });

      if (destroyWhenStopped) {
        this.nextTick(() => {
          this.events[event].allInstances = this.events[
            event
          ].allInstances.filter(
            (instance) => !instancesInTag.includes(instance)
          );
          this.events[event].instance.set(tag, []);
        });
      }
    }

    startOneTimeEvent(event) {
      if (!this.initEvent(event)) return;

      const outval = {};
      this.assert(this.events[event].description.createInstance(outval));
      this.assert(outval.val.start());
      this.assert(outval.val.release());
    }

    setEventPaused(event, tag, paused) {
      if (!this.initEvent(event)) return;

      const instancesInTag = this.events[event].instance.get(tag);
      if (!instancesInTag || instancesInTag.length === 0) {
        return;
      }

      instancesInTag.forEach((instance) => {
        this.assert(instance.setPaused(!paused));
      });
    }

    stopEvent(event, tag, allowFadeOut, release) {
      if (!this.initEvent(event)) return;

      const instancesInTag = this.events[event].instance.get(tag);
      if (!instancesInTag || instancesInTag.length === 0) {
        return;
      }

      instancesInTag.forEach((instance) => {
        this.assert(
          instance.stop(
            allowFadeOut
              ? this.FMOD.STUDIO_STOP_ALLOWFADEOUT
              : this.FMOD.STUDIO_STOP_IMMEDIATE
          )
        );
        if (release) {
          this.assert(instance.release());
        }
      });

      if (release) {
        this.events[event].allInstances = this.events[
          event
        ].allInstances.filter((instance) => !instancesInTag.includes(instance));
        this.events[event].instance.set(tag, []);
      }
    }

    stopAllEventInstances(event, allowFadeOut, release) {
      if (!this.initEvent(event)) return;

      this.events[event].allInstances.forEach((instance) => {
        this.assert(
          instance.stop(
            allowFadeOut
              ? this.FMOD.STUDIO_STOP_ALLOWFADEOUT
              : this.FMOD.STUDIO_STOP_IMMEDIATE
          )
        );
        if (release) {
          this.assert(instance.release());
        }
      });

      if (release) {
        this.events[event].instance = new Map();
        this.events[event].allInstances = [];
      }
    }

    stopAllEvents(allowFadeOut, release) {
      Object.keys(this.events).forEach((event) => {
        this.stopAllEventInstances(event, allowFadeOut, release);
      });
    }

    releaseEvent(event, tag) {
      if (!this.initEvent(event)) return;

      const instancesInTag = this.events[event].instance.get(tag);
      if (!instancesInTag || instancesInTag.length === 0) {
        return;
      }

      instancesInTag.forEach((instance) => {
        this.assert(instance.release());
      });

      this.events[event].allInstances = this.events[event].allInstances.filter(
        (instance) => !instancesInTag.includes(instance)
      );
      this.events[event].instance.set(tag, []);
    }

    releaseAllEventInstances(event) {
      if (!this.initEvent(event)) return;

      this.events[event].allInstances.forEach((instance) => {
        this.assert(instance.release());
      });

      this.events[event].instance = new Map();
      this.events[event].allInstances = [];
    }

    //====================================================================
    // Parameter Methods
    //====================================================================

    setEventParameter(event, tag, parameter, isId, value, ignoreSeekSpeed) {
      if (!this.initEvent(event)) return;

      const instancesInTag = this.events[event].instance.get(tag);
      if (!instancesInTag || instancesInTag.length === 0) {
        return;
      }

      instancesInTag.forEach((instance) => {
        this.assert(
          isId
            ? instance.setParameterByID(parameter, value, ignoreSeekSpeed)
            : instance.setParameterByName(parameter, value, ignoreSeekSpeed)
        );
      });
    }

    waitForEventStop(event, tag) {
      if (!this.initEvent(event)) return;
      const instancesInTag = this.events[event].instance.get(tag);
      if (!instancesInTag || instancesInTag.length === 0) {
        return;
      }
      return Promise.all(
        instancesInTag.map((instance) => {
          new Promise((resolve) => {
            instance.setCallback(
              resolve,
              this.FMOD.STUDIO_EVENT_CALLBACK_STOPPED
            );
          });
        })
      );
    }

    setEventParameterWithLabel(
      event,
      tag,
      parameter,
      isId,
      value,
      ignoreSeekSpeed
    ) {
      if (!this.initEvent(event)) return;

      const instancesInTag = this.events[event].instance.get(tag);
      if (!instancesInTag || instancesInTag.length === 0) {
        return;
      }

      instancesInTag.forEach((instance) => {
        this.assert(
          isId
            ? instance.setParameterByIDWithLabel(
                parameter,
                value,
                ignoreSeekSpeed
              )
            : instance.setParameterByNameWithLabel(
                parameter,
                value,
                ignoreSeekSpeed
              )
        );
      });
    }

    setEventTimelinePosition(event, tag, position) {
      if (!this.initEvent(event)) return;

      const instancesInTag = this.events[event].instance.get(tag);
      if (!instancesInTag || instancesInTag.length === 0) {
        return;
      }

      instancesInTag.forEach((instance) => {
        this.assert(instance.setTimelinePosition(position));
      });
    }

    setGlobalParameter(parameter, isId, value, ignoreSeekSpeed) {
      if (!this.gSystem) return;
      this.assert(
        isId
          ? this.gSystem.setParameterByID(parameter, value, ignoreSeekSpeed)
          : this.gSystem.setParameterByName(parameter, value, ignoreSeekSpeed)
      );
    }

    setGlobalParameterWithLabel(parameter, isId, value, ignoreSeekSpeed) {
      if (!this.gSystem) return;
      this.assert(
        isId
          ? this.gSystem.setParameterByIDWithLabel(
              parameter,
              value,
              ignoreSeekSpeed
            )
          : this.gSystem.setParameterByNameWithLabel(
              parameter,
              value,
              ignoreSeekSpeed
            )
      );
    }

    //====================================================================
    // 3D Spatial Audio Methods
    //====================================================================

    setEvent3DAttributes(
      event,
      tag,
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
      uz
    ) {
      if (!this.initEvent(event)) return;

      const instancesInTag = this.events[event].instance.get(tag);
      if (!instancesInTag || instancesInTag.length === 0) {
        return;
      }

      const attributes = { ...this.FMOD._3D_ATTRIBUTES() };
      attributes.position = { x, y, z };
      attributes.velocity = { x: vx, y: vy, z: vz };
      attributes.forward = { x: fx, y: fy, z: fz };
      attributes.up = { x: ux, y: uy, z: uz };

      instancesInTag.forEach((instance) => {
        this.assert(instance.set3DAttributes(attributes));
      });
    }

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
      hasSeparateAttenuationPosition,
      ax,
      ay,
      az
    ) {
      if (!this.gSystem) return;

      const attributes = { ...this.FMOD._3D_ATTRIBUTES() };
      attributes.position = { x, y, z };
      attributes.velocity = { x: vx, y: vy, z: vz };
      attributes.forward = { x: fx, y: fy, z: fz };
      attributes.up = { x: ux, y: uy, z: uz };

      if (hasSeparateAttenuationPosition) {
        this.assert(
          this.gSystem.setListenerAttributes(id, attributes, {
            x: ax,
            y: ay,
            z: az,
          })
        );
      } else {
        this.assert(this.gSystem.setListenerAttributes(id, attributes, null));
      }
    }

    setListenerWeight(id, weight) {
      if (!this.gSystem) return;
      this.assert(this.gSystem.setListenerWeight(id, weight));
    }

    setNbListeners(nb) {
      if (!this.gSystem) return;
      this.assert(this.gSystem.setNumListeners(nb));
    }

    //====================================================================
    // Mixing Methods
    //====================================================================

    setBusMuted(bus, muted) {
      if (!this.initBus(bus)) return;
      this.assert(this.buses[bus].setMute(muted));
    }

    setBusVolume(bus, volume) {
      if (!this.initBus(bus)) return;
      this.assert(this.buses[bus].setVolume(volume));
    }

    setBusPaused(bus, paused) {
      if (!this.initBus(bus)) return;
      this.assert(this.buses[bus].setPaused(paused));
    }

    stopAllBusEvents(bus, allowFadeOut) {
      if (!this.initBus(bus)) return;
      this.assert(
        this.buses[bus].stopAllEvents(
          allowFadeOut
            ? this.FMOD.STUDIO_STOP_ALLOWFADEOUT
            : this.FMOD.STUDIO_STOP_IMMEDIATE
        )
      );
    }

    setVCAVolume(vca, volume) {
      if (!this.initVCA(vca)) return;
      this.assert(this.vcas[vca].setVolume(volume));
    }

    setSuspended(suspended, time) {
      if (!this.gSystemCore) return;
      if (time <= this.lastSuspendTime) return;

      this.lastSuspendTime = time;
      if (suspended) {
        this.assert(this.gSystemCore.mixerSuspend());
      } else {
        this.assert(this.gSystemCore.mixerResume());
      }
    }
  };
}
