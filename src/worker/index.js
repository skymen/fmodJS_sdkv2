// Web worker entry: hosts FMOD so the mixer never depends on the main thread.
//
// The real AudioContext and AudioWorkletNode are created by the DOM side
// (src/domside/index.js). FMOD's Emscripten glue only needs a handful of
// Web Audio calls, which it makes through Module.window, so we hand it a
// shim: addModule() ships the worklet processor Blob to the main thread,
// which creates the node and transfers its MessagePort back here. From then
// on the worklet talks to this worker directly.
import createManager from "./manager.js";
import messageNames from "../shared/messageNames.js";

let sampleRate = 48000;
let maxChannelCount = 2;
let workletPort = null;
let pendingAddModule = null;
let lastBlob = null;
const windowListeners = new Map();

// FMOD creates its worklet processor as a Blob URL; keep the Blob so the main
// thread can register it on the real context.
const createObjectURL = URL.createObjectURL.bind(URL);
URL.createObjectURL = (blob) => {
  lastBlob = blob;
  return createObjectURL(blob);
};

class AudioWorkletShim {
  addModule() {
    return new Promise((resolve, reject) => {
      pendingAddModule = { resolve, reject };
      postMessage({ type: "addModule", blob: lastBlob });
    });
  }
}

class AudioContextShim {
  constructor() {
    this.sampleRate = sampleRate;
    this.state = "suspended";
    this.destination = { channelCount: maxChannelCount, maxChannelCount };
    this.audioWorklet = new AudioWorkletShim();
  }
  resume() {
    this.state = "running";
    postMessage({ type: "resume" });
    return Promise.resolve();
  }
  suspend() {
    this.state = "suspended";
    postMessage({ type: "suspend" });
    return Promise.resolve();
  }
  close() {
    return Promise.resolve();
  }
}

class AudioWorkletNodeShim {
  constructor() {
    if (!workletPort) throw new Error("FMOD: worklet port not available");
    this.port = workletPort;
  }
  connect() {}
  disconnect() {}
}
// FMOD checks self.AudioWorkletNode to decide on the worklet output
self.AudioWorkletNode = AudioWorkletNodeShim;

const audioWindow = {
  AudioContext: AudioContextShim,
  addEventListener(name, fn) {
    windowListeners.set(name, fn);
    postMessage({ type: "listen", name });
  },
  removeEventListener(name) {
    windowListeners.delete(name);
  },
};

class WorkerHandlerBase {
  constructor() {
    this._handlers = new Map();
  }
  AddRuntimeMessageHandlers(list) {
    for (const [name, fn] of list) this._handlers.set(name, fn);
  }
}

// Network requests made from inside the worker aren't served in Construct's
// preview (only the page goes through its service worker), and relative URLs
// don't resolve against a blob: worker, so every load goes via the main
// thread and comes back as a transferred ArrayBuffer.
let nextFetchId = 1;
const pendingFetches = new Map();
function fetchArrayBuffer(url) {
  return new Promise((resolve, reject) => {
    const id = nextFetchId++;
    pendingFetches.set(id, { resolve, reject });
    postMessage({ type: "fetch", id, url });
  });
}

let manager = null;

function configure(m) {
  sampleRate = m.sampleRate;
  maxChannelCount = m.maxChannelCount;
  manager = new (createManager(WorkerHandlerBase))({
    audioWindow,
    libBase: m.libBase,
    fetchArrayBuffer,
    postToRuntime: (name, data) =>
      postMessage({ type: "toRuntime", name, data }),
  });
  for (const name of messageNames) {
    if (!manager._handlers.has(name))
      console.warn(`FMOD worker: no handler for "${name}"`);
  }
  // Studio update runs here on its own clock instead of the runtime tick
  setInterval(() => manager.update(), 16);
}

async function call(m) {
  const fn = manager && manager._handlers.get(m.name);
  if (!fn) {
    postMessage({ type: "reply", id: m.id, error: `unknown message ${m.name}` });
    return;
  }
  try {
    const result = await fn(m.data);
    postMessage({ type: "reply", id: m.id, result });
  } catch (error) {
    postMessage({
      type: "reply",
      id: m.id,
      error: (error && error.message) || String(error),
    });
  }
}

self.onmessage = (ev) => {
  const m = ev.data;
  switch (m.type) {
    case "configure":
      configure(m);
      break;
    case "call":
      call(m);
      break;
    case "workletPort":
      workletPort = m.port;
      if (pendingAddModule) {
        pendingAddModule.resolve();
        pendingAddModule = null;
      }
      break;
    case "fetchResult": {
      const p = pendingFetches.get(m.id);
      if (!p) break;
      pendingFetches.delete(m.id);
      if (m.error !== undefined) p.reject(new Error(m.error));
      else p.resolve(m.buffer);
      break;
    }
    case "workletError":
      if (pendingAddModule) {
        pendingAddModule.reject(new Error(m.error));
        pendingAddModule = null;
      }
      break;
    case "windowEvent": {
      const fn = windowListeners.get(m.name);
      if (fn) fn();
      break;
    }
    case "userInteraction":
      if (manager) manager.OnUserInteraction(m.real);
      break;
  }
};
