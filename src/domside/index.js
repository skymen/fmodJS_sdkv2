// DOM side: a relay between the Construct runtime and the FMOD worker, plus
// the one thing that must live on the main thread — the real AudioContext.
// See src/worker/index.js for the other half.
import messageNames from "../shared/messageNames.js";

const INTERACTION_EVENTS = [
  "click",
  "touchstart",
  "keydown",
  "mousedown",
  "mouseup",
  "touchend",
  "touchcancel",
];

export default function (parentClass) {
  return class FMODRelay extends parentClass {
    constructor(iRuntime) {
      super(iRuntime);

      this.worker = null;
      this.audioContext = null;
      this.workletNode = null;
      this._nextId = 1;
      this._pending = new Map();
      this._interactionSeen = false;

      this.AddRuntimeMessageHandlers([
        // The worker updates on its own timer; the runtime tick is not needed
        ["update", () => {}],
        ...messageNames
          .filter((name) => name !== "update")
          .map((name) => [name, (data) => this._call(name, data)]),
      ]);

      this._workerReady = this._startWorker();
    }

    async _startWorker() {
      const base = globalThis.__skymen_fmod_libBase || "";

      // Fetch + Blob so the worker works wherever the addon files are served
      // from, then importScripts() absolute URLs from inside it.
      const response = await fetch(base + "fmodworker.js");
      if (!response.ok)
        throw new Error(`FMOD: failed to fetch worker (${response.status})`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      this.worker = new Worker(url);
      URL.revokeObjectURL(url);
      this.worker.onmessage = (ev) => this._onWorkerMessage(ev.data);
      this.worker.onerror = (ev) => {
        console.error("FMOD worker error:", ev.message || ev);
      };

      const AudioContextClass =
        globalThis.AudioContext || globalThis.webkitAudioContext;
      this.audioContext = new AudioContextClass();
      this.audioContext.destination.channelCount =
        this.audioContext.destination.maxChannelCount;

      this.worker.postMessage({
        type: "configure",
        libBase: base,
        sampleRate: this.audioContext.sampleRate,
        maxChannelCount: this.audioContext.destination.maxChannelCount,
      });

      this._setupInteractionListeners();
    }

    _call(name, data) {
      return this._workerReady.then(
        () =>
          new Promise((resolve, reject) => {
            const id = this._nextId++;
            this._pending.set(id, { resolve, reject });
            this.worker.postMessage({ type: "call", id, name, data });
          })
      );
    }

    async _onWorkerMessage(m) {
      switch (m.type) {
        case "reply": {
          const p = this._pending.get(m.id);
          if (!p) return;
          this._pending.delete(m.id);
          if (m.error !== undefined) p.reject(new Error(m.error));
          else p.resolve(m.result);
          break;
        }
        case "addModule": {
          const url = URL.createObjectURL(m.blob);
          try {
            await this.audioContext.audioWorklet.addModule(url);
            this.workletNode = new AudioWorkletNode(
              this.audioContext,
              "audio-processor",
              {
                outputChannelCount: [
                  this.audioContext.destination.maxChannelCount,
                ],
              }
            );
            this.workletNode.connect(this.audioContext.destination);
            const port = this.workletNode.port;
            this.worker.postMessage({ type: "workletPort", port }, [port]);
          } catch (error) {
            console.error("FMOD: failed to create audio worklet", error);
            this.worker.postMessage({
              type: "workletError",
              error: (error && error.message) || String(error),
            });
          } finally {
            URL.revokeObjectURL(url);
          }
          break;
        }
        case "resume":
          this.audioContext.resume().catch(() => {});
          break;
        case "suspend":
          this.audioContext.suspend().catch(() => {});
          break;
        case "listen":
          // FMOD's own "resume on gesture" listeners
          window.addEventListener(
            m.name,
            () => this.worker.postMessage({ type: "windowEvent", name: m.name }),
            { once: true }
          );
          break;
      }
    }

    // iOS/Chrome workaround: the context must be resumed from a real user
    // gesture on the main thread; the worker is told so FMOD can follow.
    _setupInteractionListeners() {
      const onInteraction = () => {
        if (this._interactionSeen) return;
        this._interactionSeen = true;
        this.audioContext.resume().catch(() => {});
        this.worker.postMessage({ type: "userInteraction", real: true });
        INTERACTION_EVENTS.forEach((eventType) =>
          document.removeEventListener(eventType, onInteraction)
        );
      };
      INTERACTION_EVENTS.forEach((eventType) =>
        document.addEventListener(eventType, onInteraction)
      );
    }
  };
}
