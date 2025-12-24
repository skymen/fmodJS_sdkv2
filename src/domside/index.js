import FMODWrapper from "./FMODWrapper.js";
import oldIndex from "./index.old.js";

const useOldIndex = false;

export default function (parentClass) {
  if (useOldIndex) {
    return oldIndex(parentClass);
  }

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

      // Create wrapper instance
      this.wrapper = null;

      // State variables
      this.lastSuspendTime = 0;
      this._preRunCallbacks = [];
      this._initCallbacks = [];
      this._loaded = false;

      // Error tracking for stability
      this._errorCount = 0;
      this._lastErrorTime = 0;
      this._errorResetInterval = 60000; // Reset error count every 60 seconds

      // Listener tracking
      this._numListeners = 1;
      this._listenersInitialized = false;

      // Bank preload configuration
      this.bankConfigs = [];
      this.banksByName = new Map();
      this.banksByPath = new Map();

      // Scheduling
      this.nextTickArray = [];

      // Advanced settings
      this.advancedSettings = {};
      this.dspBufferSize = 1024;
      this.dspBufferCount = 4;
      this.maxChannels = 1024;

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
          ([path, preload, nonBlocking, name, url, loadSampleData]) =>
            this.PreInitLoadBank(
              path,
              preload,
              nonBlocking,
              name,
              url,
              loadSampleData
            ),
        ],
        ["start-one-time-event", ([event]) => this.startOneTimeEvent(event)],

        ["update", () => this.update()],
        [
          "load-bank",
          ([name, loadSampleData]) => this.loadBank(name, loadSampleData),
        ],
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
          "start-event-at-position",
          ([
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
            uz,
            destroyWhenStopped,
          ]) =>
            this.startEventAtPosition(
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
              uz,
              destroyWhenStopped
            ),
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
          ([allowFadeOut, release]) =>
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
        ["load-bank-sample-data", ([name]) => this.loadBankSampleData(name)],
        [
          "unload-bank-sample-data",
          ([name]) => this.unloadBankSampleData(name),
        ],
        ["load-event-sample-data", ([name]) => this.loadEventSampleData(name)],
        [
          "unload-event-sample-data",
          ([name]) => this.unloadEventSampleData(name),
        ],
      ]);
    }

    PreInitLoadBank(
      path,
      preload,
      nonBlocking,
      name,
      url,
      loadSampleData = false
    ) {
      const bankConfig = {
        path,
        preload,
        nonBlocking,
        name,
        url,
        loaded: false,
        loadSampleData,
      };
      this.bankConfigs.push(bankConfig);
      this.banksByName.set(name, bankConfig);
      this.banksByPath.set(path, bankConfig);
    }

    async WaitForPreloadBanks() {
      await Promise.all(
        this.bankConfigs.map(async (bankConfig) => {
          if (bankConfig.preload) {
            const promise = this.loadBank(bankConfig);
            if (!bankConfig.nonBlocking) await promise;
          }
        })
      );
    }

    PreInit(config) {
      this.advancedSettings = config.advancedSettings || {};
      this.dspBufferSize = config.dspBufferSize || 1024;
      this.dspBufferCount = config.dspBufferCount || 4;
      this.maxChannels = config.maxChannels || 1024;
      this.FMOD["INITIAL_MEMORY"] = (config.initialMemory || 80) * 1024 * 1024;
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

    async onRuntimeInitialized() {
      try {
        // Initialize the wrapper with the FMOD global
        await this.initWrapper();

        // Set up audio resume handlers (iOS/Chrome workaround)
        this.wrapper.setupAudioResumeHandlers();

        this._loaded = true;
        this._initCallbacks.forEach((cb) => cb());
        this._initCallbacks = [];

        return this.FMOD.OK;
      } catch (error) {
        console.error(
          "FMOD [onRuntimeInitialized]: Critical error during runtime initialization:",
          error
        );
        throw error;
      }
    }

    async initWrapper() {
      // Create wrapper instance
      this.wrapper = new FMODWrapper(this.FMOD);

      // Let the wrapper initialize FMOD with custom options
      await this.wrapper.initialize({
        maxChannels: this.maxChannels,
        dspBufferSize: this.dspBufferSize,
        numBuffers: this.dspBufferCount,
        advancedSettings: this.advancedSettings,
      });
    }

    //====================================================================
    // Utility Methods
    //====================================================================

    nextTick(fn) {
      this.nextTickArray.push(fn);
    }

    update() {
      if (!this.wrapper || !this._loaded) {
        return;
      }

      try {
        // Execute scheduled functions
        this.nextTickArray.forEach((fn) => {
          try {
            fn();
          } catch (error) {
            console.error("FMOD [update]: Error in scheduled function:", error);
            this._trackError();
          }
        });
        this.nextTickArray = [];

        // Update wrapper (handles instance cleanup)
        this.wrapper.update();
      } catch (error) {
        console.error("FMOD [update]: Critical error in update cycle:", error);
        this._trackError();
      }
    }

    _trackError() {
      const now = Date.now();

      if (now - this._lastErrorTime > this._errorResetInterval) {
        this._errorCount = 0;
      }

      this._errorCount++;
      this._lastErrorTime = now;

      if (this._errorCount > 10) {
        console.warn(
          `FMOD: Detected ${this._errorCount} errors in ${
            (now - (this._lastErrorTime - this._errorResetInterval)) / 1000
          }s. Audio system may be unstable.`
        );
      }
    }

    assert(result) {
      if (result != this.FMOD.OK) {
        const errorMsg = this.FMOD.ErrorString(result);
        console.error("FMOD [assert]: Error code", result, ":", errorMsg);
        const error = new Error(errorMsg);
        error.fmodErrorCode = result;
        error.fmodErrorString = errorMsg;
        throw error;
      }
    }

    check(result, context = "") {
      if (result != this.FMOD.OK) {
        const errorMsg = this.FMOD.ErrorString(result);
        console.error(
          `FMOD [check]${context ? ` (${context})` : ""}: Error code`,
          result,
          ":",
          errorMsg
        );
        return false;
      }
      return true;
    }

    _formatError(error) {
      return error.fmodErrorString || error.message || String(error);
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

    //====================================================================
    // Bank Management Methods
    //====================================================================

    async loadBank(bankOrName, loadSampleData) {
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

      // Use the loadSampleData parameter if provided, otherwise use the bank config value
      const shouldLoadSampleData =
        loadSampleData !== undefined
          ? loadSampleData
          : bankOrName.loadSampleData;

      try {
        const memory = await this.fetchUrlAsInt8Array(bankOrName.url);
        const bankhandle = {};

        const errno = this.wrapper.loadBankMemory(
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

        // Wait for bank to be fully loaded
        await this.wrapper.awaitBankLoadingState(
          bankOrName.bankHandle,
          this.FMOD.STUDIO_LOADING_STATE_LOADED
        );

        bankOrName.loaded = true;

        // Register in wrapper's bank tracking
        this.wrapper.banks.set(bankOrName.name, {
          handle: bankOrName.bankHandle,
          loaded: true,
          loading: false,
        });

        // Load sample data if requested
        if (shouldLoadSampleData) {
          await this.loadBankSampleData(bankOrName);
        }

        return bankOrName;
      } catch (error) {
        console.error(`FMOD [loadBank]: Failed to load bank`, error);
        throw error;
      }
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

      try {
        this.assert(bankOrName.bankHandle.unload());

        await this.wrapper.awaitBankLoadingState(
          bankOrName.bankHandle,
          this.FMOD.STUDIO_LOADING_STATE_UNLOADED
        );

        bankOrName.loaded = false;

        // Remove from wrapper tracking
        this.wrapper.banks.delete(bankOrName.name);
        this.wrapper.eventDescriptions.clear();

        return bankOrName;
      } catch (error) {
        console.error(`FMOD [unloadBank]: Failed to unload bank`, error);
        throw error;
      }
    }

    async unloadAllBanks() {
      await Promise.all(
        this.bankConfigs.map(async (bank) => {
          if (bank.loaded) {
            await this.unloadBank(bank);
          }
        })
      );
    }

    //====================================================================
    // Event Management Methods (Delegated to Wrapper)
    //====================================================================

    instantiateEvent(event, tags) {
      if (!this.wrapper) return null;
      try {
        return this.wrapper.instantiateEvent(event, tags);
      } catch (error) {
        console.error(
          `FMOD [instantiateEvent]: Failed for event="${event}", tags="${tags}"`,
          error
        );
        return null;
      }
    }

    startEvent(event, tags, destroyWhenStopped) {
      if (!this.wrapper) return null;
      try {
        return this.wrapper.startEvent(event, tags, destroyWhenStopped);
      } catch (error) {
        console.error(
          `FMOD [startEvent]: Failed for event="${event}", tags="${tags}"`,
          error
        );
        return null;
      }
    }

    startEventAtPosition(
      event,
      tags,
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
      destroyWhenStopped
    ) {
      if (!this.wrapper) return null;
      try {
        return this.wrapper.startEventAtPosition(
          event,
          tags,
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
          destroyWhenStopped
        );
      } catch (error) {
        console.error(
          `FMOD [startEventAtPosition]: Failed for event="${event}", tags="${tags}"`,
          error
        );
        return null;
      }
    }

    startOneTimeEvent(event) {
      if (!this.wrapper) return false;
      try {
        return this.wrapper.startOneTimeEvent(event);
      } catch (error) {
        console.error(
          `FMOD [startOneTimeEvent]: Failed for event="${event}"`,
          error
        );
        return false;
      }
    }

    setEventPaused(name, tag, paused) {
      if (!this.wrapper) return;
      try {
        this.wrapper.setEventPaused(name, tag, paused);
      } catch (error) {
        console.error(
          `FMOD [setEventPaused]: Failed for name="${name}", tag="${tag}"`,
          error
        );
      }
    }

    stopEvent(name, tag, allowFadeOut, release) {
      if (!this.wrapper) return;
      try {
        this.wrapper.stopEvent(name, tag, allowFadeOut, release);
      } catch (error) {
        console.error(
          `FMOD [stopEvent]: Failed for name="${name}", tag="${tag}"`,
          error
        );
      }
    }

    stopAllEventInstances(name, allowFadeOut, release) {
      if (!this.wrapper) return;
      try {
        this.wrapper.stopAllEventInstances(name, allowFadeOut, release);
      } catch (error) {
        console.error(
          `FMOD [stopAllEventInstances]: Failed for name="${name}"`,
          error
        );
      }
    }

    stopAllEvents(allowFadeOut, release) {
      if (!this.wrapper) return;
      try {
        this.wrapper.stopAllEvents(allowFadeOut, release);
      } catch (error) {
        console.error(`FMOD [stopAllEvents]: Failed`, error);
      }
    }

    releaseEvent(name, tag) {
      if (!this.wrapper) return;
      try {
        // Use stopEvent with release=true, allowFadeOut=false
        this.wrapper.stopEvent(name, tag, false, true);
      } catch (error) {
        console.error(
          `FMOD [releaseEvent]: Failed for name="${name}", tag="${tag}"`,
          error
        );
      }
    }

    releaseAllEventInstances(name) {
      if (!this.wrapper) return;
      try {
        this.wrapper.releaseAllEventInstances(name);
      } catch (error) {
        console.error(
          `FMOD [releaseAllEventInstances]: Failed for name="${name}"`,
          error
        );
      }
    }

    //====================================================================
    // Parameter Methods (Delegated to Wrapper)
    //====================================================================

    setEventParameter(name, tag, parameter, isId, value, ignoreSeekSpeed) {
      if (!this.wrapper) return;
      try {
        this.wrapper.setEventParameter(
          name,
          tag,
          parameter,
          isId,
          value,
          ignoreSeekSpeed
        );
      } catch (error) {
        console.error(
          `FMOD [setEventParameter]: Failed for name="${name}", parameter="${parameter}"`,
          error
        );
      }
    }

    setEventParameterWithLabel(
      name,
      tag,
      parameter,
      isId,
      value,
      ignoreSeekSpeed
    ) {
      if (!this.wrapper) return;
      try {
        this.wrapper.setEventParameterWithLabel(
          name,
          tag,
          parameter,
          isId,
          value,
          ignoreSeekSpeed
        );
      } catch (error) {
        console.error(
          `FMOD [setEventParameterWithLabel]: Failed for name="${name}", parameter="${parameter}"`,
          error
        );
      }
    }

    setEventTimelinePosition(name, tag, position) {
      if (!this.wrapper) return;
      try {
        this.wrapper.setEventTimelinePosition(name, tag, position);
      } catch (error) {
        console.error(
          `FMOD [setEventTimelinePosition]: Failed for name="${name}", position=${position}`,
          error
        );
      }
    }

    waitForEventStop(name, tag) {
      if (!this.wrapper) return;
      try {
        return this.wrapper.waitForEventStop(name, tag);
      } catch (error) {
        console.error(
          `FMOD [waitForEventStop]: Failed for name="${name}", tag="${tag}"`,
          error
        );
      }
    }

    setGlobalParameter(parameter, isId, value, ignoreSeekSpeed) {
      if (!this.wrapper) return;
      try {
        this.wrapper.setGlobalParameter(
          parameter,
          isId,
          value,
          ignoreSeekSpeed
        );
      } catch (error) {
        console.error(
          `FMOD [setGlobalParameter]: Failed for parameter="${parameter}"`,
          error
        );
      }
    }

    setGlobalParameterWithLabel(parameter, isId, value, ignoreSeekSpeed) {
      if (!this.wrapper) return;
      try {
        this.wrapper.setGlobalParameterWithLabel(
          parameter,
          isId,
          value,
          ignoreSeekSpeed
        );
      } catch (error) {
        console.error(
          `FMOD [setGlobalParameterWithLabel]: Failed for parameter="${parameter}"`,
          error
        );
      }
    }

    //====================================================================
    // 3D Spatial Audio Methods (Delegated to Wrapper)
    //====================================================================

    setEvent3DAttributes(
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
    ) {
      if (!this.wrapper) return;

      // Validate input values
      const values = [x, y, z, vx, vy, vz, fx, fy, fz, ux, uy, uz];
      for (const val of values) {
        if (!isFinite(val)) {
          console.error(
            `FMOD [setEvent3DAttributes]: Invalid value detected (NaN or Infinity)`
          );
          return;
        }
      }

      try {
        this.wrapper.setEvent3DAttributes(
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
        );
      } catch (error) {
        console.error(
          `FMOD [setEvent3DAttributes]: Failed for name="${name}", tag="${tag}"`,
          error
        );
      }
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
      if (!this.wrapper || !this._loaded) {
        console.warn(
          `FMOD [setListener3DAttributes]: System not ready, skipping for listener id=${id}`
        );
        return;
      }

      if (id < 0 || id >= this._numListeners) {
        console.error(
          `FMOD [setListener3DAttributes]: Invalid listener id=${id}. ` +
            `Valid range is 0 to ${this._numListeners - 1}.`
        );
        return;
      }

      // Validate input values
      const values = [x, y, z, vx, vy, vz, fx, fy, fz, ux, uy, uz];
      if (hasSeparateAttenuationPosition) {
        values.push(ax, ay, az);
      }

      for (const val of values) {
        if (!isFinite(val)) {
          console.error(
            `FMOD [setListener3DAttributes]: Invalid value detected (NaN or Infinity)`
          );
          return;
        }
      }

      try {
        this.wrapper.setListener3DAttributes(
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
        );
      } catch (error) {
        console.error(
          `FMOD [setListener3DAttributes]: Failed for listener id=${id}`,
          error
        );
      }
    }

    setListenerWeight(id, weight) {
      if (!this.wrapper) return;
      try {
        this.wrapper.setListenerWeight(id, weight);
      } catch (error) {
        console.error(
          `FMOD [setListenerWeight]: Failed for id=${id}, weight=${weight}`,
          error
        );
      }
    }

    setNbListeners(nb) {
      if (!this.wrapper) return;
      try {
        this.wrapper.setNbListeners(nb);
        this._numListeners = nb;
        this._listenersInitialized = true;
      } catch (error) {
        console.error(`FMOD [setNbListeners]: Failed for nb=${nb}`, error);
      }
    }

    //====================================================================
    // Mixing Methods (Delegated to Wrapper)
    //====================================================================

    setBusMuted(bus, muted) {
      if (!this.wrapper) return;
      try {
        this.wrapper.setBusMuted(bus, muted);
      } catch (error) {
        console.error(
          `FMOD [setBusMuted]: Failed for bus="${bus}", muted=${muted}`,
          error
        );
      }
    }

    setBusVolume(bus, volume) {
      if (!this.wrapper) return;
      try {
        this.wrapper.setBusVolume(bus, volume);
      } catch (error) {
        console.error(
          `FMOD [setBusVolume]: Failed for bus="${bus}", volume=${volume}`,
          error
        );
      }
    }

    setBusPaused(bus, paused) {
      if (!this.wrapper) return;
      try {
        this.wrapper.setBusPaused(bus, paused);
      } catch (error) {
        console.error(
          `FMOD [setBusPaused]: Failed for bus="${bus}", paused=${paused}`,
          error
        );
      }
    }

    stopAllBusEvents(bus) {
      if (!this.wrapper) return;
      try {
        this.wrapper.stopAllBusEvents(bus);
      } catch (error) {
        console.error(
          `FMOD [stopAllBusEvents]: Failed for bus="${bus}"`,
          error
        );
      }
    }

    setVCAVolume(vca, volume) {
      if (!this.wrapper) return;
      try {
        this.wrapper.setVCAVolume(vca, volume);
      } catch (error) {
        console.error(
          `FMOD [setVCAVolume]: Failed for vca="${vca}", volume=${volume}`,
          error
        );
      }
    }

    setSuspended(suspended, time) {
      if (!this.wrapper) return;
      if (time <= this.lastSuspendTime) return;

      this.lastSuspendTime = time;
      try {
        this.wrapper.setSuspended(suspended);
      } catch (error) {
        console.error(
          `FMOD [setSuspended]: Failed for suspended=${suspended}`,
          error
        );
      }
    }

    //====================================================================
    // Sample Data Management Methods (Delegated to Wrapper)
    //====================================================================

    async loadBankSampleData(bankOrName) {
      if (typeof bankOrName === "string") {
        bankOrName =
          this.banksByName.get(bankOrName) || this.banksByPath.get(bankOrName);
      }

      if (!bankOrName || !bankOrName.loaded) {
        console.error("Bank not found or not loaded.");
        return;
      }

      try {
        await this.wrapper.loadBankSampleData(bankOrName.bankHandle);
      } catch (error) {
        console.error(
          `FMOD [loadBankSampleData]: Failed for bank="${bankOrName.name}"`,
          error
        );
      }
    }

    async unloadBankSampleData(bankOrName) {
      if (typeof bankOrName === "string") {
        bankOrName =
          this.banksByName.get(bankOrName) || this.banksByPath.get(bankOrName);
      }

      if (!bankOrName || !bankOrName.loaded) {
        console.error("Bank not found or not loaded.");
        return;
      }

      try {
        await this.wrapper.unloadBankSampleData(bankOrName.bankHandle);
      } catch (error) {
        console.error(
          `FMOD [unloadBankSampleData]: Failed for bank="${bankOrName.name}"`,
          error
        );
      }
    }

    async loadEventSampleData(name) {
      if (!this.wrapper) return;
      try {
        await this.wrapper.loadEventSampleData(name);
      } catch (error) {
        console.error(
          `FMOD [loadEventSampleData]: Failed for event="${name}"`,
          error
        );
      }
    }

    async unloadEventSampleData(name) {
      if (!this.wrapper) return;
      try {
        await this.wrapper.unloadEventSampleData(name);
      } catch (error) {
        console.error(
          `FMOD [unloadEventSampleData]: Failed for event="${name}"`,
          error
        );
      }
    }
  };
}
