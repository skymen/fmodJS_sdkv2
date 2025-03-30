var FMODModule = (() => {
  var _scriptName =
    typeof document != "undefined" ? document.currentScript?.src : undefined;
  if (typeof __filename != "undefined") _scriptName = _scriptName || __filename;
  return function (moduleArg = {}) {
    var moduleRtn;

    var Module = moduleArg;
    var readyPromiseResolve, readyPromiseReject;
    var readyPromise = new Promise((resolve, reject) => {
      readyPromiseResolve = resolve;
      readyPromiseReject = reject;
    });
    var ENVIRONMENT_IS_WEB = typeof window == "object";
    var ENVIRONMENT_IS_WORKER = typeof importScripts == "function";
    var ENVIRONMENT_IS_NODE =
      typeof process == "object" &&
      typeof process.versions == "object" &&
      typeof process.versions.node == "string";
    if (ENVIRONMENT_IS_NODE) {
      try {
        if (__dirname === undefined) ENVIRONMENT_IS_NODE = false;
      } catch (error) {
        ENVIRONMENT_IS_NODE = false;
      }
    }
    var moduleOverrides = Object.assign({}, Module);
    var arguments_ = [];
    var thisProgram = "./this.program";
    var quit_ = (status, toThrow) => {
      throw toThrow;
    };
    var scriptDirectory = "";
    function locateFile(path) {
      if (Module["locateFile"]) {
        return Module["locateFile"](path, scriptDirectory);
      }
      return scriptDirectory + path;
    }
    var readAsync, readBinary;
    if (ENVIRONMENT_IS_NODE) {
      var fs = require("fs");
      var nodePath = require("path");
      scriptDirectory = __dirname + "/";
      readBinary = (filename) => {
        filename = isFileURI(filename)
          ? new URL(filename)
          : nodePath.normalize(filename);
        var ret = fs.readFileSync(filename);
        return ret;
      };
      readAsync = (filename, binary = true) => {
        filename = isFileURI(filename)
          ? new URL(filename)
          : nodePath.normalize(filename);
        return new Promise((resolve, reject) => {
          fs.readFile(filename, binary ? undefined : "utf8", (err, data) => {
            if (err) reject(err);
            else resolve(binary ? data.buffer : data);
          });
        });
      };
      if (!Module["thisProgram"] && process.argv.length > 1) {
        thisProgram = process.argv[1].replace(/\\/g, "/");
      }
      arguments_ = process.argv.slice(2);
      quit_ = (status, toThrow) => {
        process.exitCode = status;
        throw toThrow;
      };
    } else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
      if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = self.location.href;
      } else if (typeof document != "undefined" && document.currentScript) {
        scriptDirectory = document.currentScript.src;
      }
      if (_scriptName) {
        scriptDirectory = _scriptName;
      }
      if (scriptDirectory.startsWith("blob:")) {
        scriptDirectory = "";
      } else {
        scriptDirectory = scriptDirectory.substr(
          0,
          scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1
        );
      }
      {
        if (ENVIRONMENT_IS_WORKER) {
          readBinary = (url) => {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, false);
            xhr.responseType = "arraybuffer";
            xhr.send(null);
            return new Uint8Array(xhr.response);
          };
        }
        readAsync = (url) => {
          if (isFileURI(url)) {
            return new Promise((resolve, reject) => {
              var xhr = new XMLHttpRequest();
              xhr.open("GET", url, true);
              xhr.responseType = "arraybuffer";
              xhr.onload = () => {
                if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
                  resolve(xhr.response);
                  return;
                }
                reject(xhr.status);
              };
              xhr.onerror = reject;
              xhr.send(null);
            });
          }
          return fetch(url, { credentials: "same-origin" }).then((response) => {
            if (response.ok) {
              return response.arrayBuffer();
            }
            return Promise.reject(
              new Error(response.status + " : " + response.url)
            );
          });
        };
      }
    } else {
    }
    var out = Module["print"] || console.log.bind(console);
    var err = Module["printErr"] || console.error.bind(console);
    Object.assign(Module, moduleOverrides);
    moduleOverrides = null;
    if (Module["arguments"]) arguments_ = Module["arguments"];
    if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
    var wasmBinary = Module["wasmBinary"];
    var wasmMemory;
    var ABORT = false;
    var EXITSTATUS;
    var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
    function updateMemoryViews() {
      var b = wasmMemory.buffer;
      Module["HEAP8"] = HEAP8 = new Int8Array(b);
      Module["HEAP16"] = HEAP16 = new Int16Array(b);
      Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
      Module["HEAPU16"] = HEAPU16 = new Uint16Array(b);
      Module["HEAP32"] = HEAP32 = new Int32Array(b);
      Module["HEAPU32"] = HEAPU32 = new Uint32Array(b);
      Module["HEAPF32"] = HEAPF32 = new Float32Array(b);
      Module["HEAPF64"] = HEAPF64 = new Float64Array(b);
    }
    if (Module["wasmMemory"]) {
      wasmMemory = Module["wasmMemory"];
    } else {
      var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 16777216;
      wasmMemory = new WebAssembly.Memory({
        initial: INITIAL_MEMORY / 65536,
        maximum: 32768,
      });
    }
    updateMemoryViews();
    var __ATPRERUN__ = [];
    var __ATINIT__ = [];
    var __ATPOSTRUN__ = [];
    var runtimeInitialized = false;
    function preRun() {
      if (Module["preRun"]) {
        if (typeof Module["preRun"] == "function")
          Module["preRun"] = [Module["preRun"]];
        while (Module["preRun"].length) {
          addOnPreRun(Module["preRun"].shift());
        }
      }
      callRuntimeCallbacks(__ATPRERUN__);
    }
    function initRuntime() {
      runtimeInitialized = true;
      if (!Module["noFSInit"] && !FS.initialized) FS.init();
      FS.ignorePermissions = false;
      TTY.init();
      callRuntimeCallbacks(__ATINIT__);
    }
    function postRun() {
      if (Module["postRun"]) {
        if (typeof Module["postRun"] == "function")
          Module["postRun"] = [Module["postRun"]];
        while (Module["postRun"].length) {
          addOnPostRun(Module["postRun"].shift());
        }
      }
      callRuntimeCallbacks(__ATPOSTRUN__);
    }
    function addOnPreRun(cb) {
      __ATPRERUN__.unshift(cb);
    }
    function addOnInit(cb) {
      __ATINIT__.unshift(cb);
    }
    function addOnPostRun(cb) {
      __ATPOSTRUN__.unshift(cb);
    }
    var runDependencies = 0;
    var runDependencyWatcher = null;
    var dependenciesFulfilled = null;
    function getUniqueRunDependency(id) {
      return id;
    }
    function addRunDependency(id) {
      runDependencies++;
      Module["monitorRunDependencies"]?.(runDependencies);
    }
    function removeRunDependency(id) {
      runDependencies--;
      Module["monitorRunDependencies"]?.(runDependencies);
      if (runDependencies == 0) {
        if (runDependencyWatcher !== null) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
        }
        if (dependenciesFulfilled) {
          var callback = dependenciesFulfilled;
          dependenciesFulfilled = null;
          callback();
        }
      }
    }
    function abort(what) {
      Module["onAbort"]?.(what);
      what = "Aborted(" + what + ")";
      err(what);
      ABORT = true;
      what += ". Build with -sASSERTIONS for more info.";
      var e = new WebAssembly.RuntimeError(what);
      readyPromiseReject(e);
      throw e;
    }
    var dataURIPrefix = "data:application/octet-stream;base64,";
    var isDataURI = (filename) => filename.startsWith(dataURIPrefix);
    var isFileURI = (filename) => filename.startsWith("file://");
    function findWasmBinary() {
      var f = "fmodstudioL.wasm";
      if (!isDataURI(f)) {
        return locateFile(f);
      }
      return f;
    }
    var wasmBinaryFile;
    function getBinarySync(file) {
      if (file == wasmBinaryFile && wasmBinary) {
        return new Uint8Array(wasmBinary);
      }
      if (readBinary) {
        return readBinary(file);
      }
      throw "both async and sync fetching of the wasm failed";
    }
    function getBinaryPromise(binaryFile) {
      if (!wasmBinary) {
        return readAsync(binaryFile).then(
          (response) => new Uint8Array(response),
          () => getBinarySync(binaryFile)
        );
      }
      return Promise.resolve().then(() => getBinarySync(binaryFile));
    }
    function instantiateArrayBuffer(binaryFile, imports, receiver) {
      return getBinaryPromise(binaryFile)
        .then((binary) => WebAssembly.instantiate(binary, imports))
        .then(receiver, (reason) => {
          err(`failed to asynchronously prepare wasm: ${reason}`);
          abort(reason);
        });
    }
    function instantiateAsync(binary, binaryFile, imports, callback) {
      if (
        !binary &&
        typeof WebAssembly.instantiateStreaming == "function" &&
        !isDataURI(binaryFile) &&
        !isFileURI(binaryFile) &&
        !ENVIRONMENT_IS_NODE &&
        typeof fetch == "function"
      ) {
        return fetch(binaryFile, { credentials: "same-origin" }).then(
          (response) => {
            var result = WebAssembly.instantiateStreaming(response, imports);
            return result.then(callback, function (reason) {
              err(`wasm streaming compile failed: ${reason}`);
              err("falling back to ArrayBuffer instantiation");
              return instantiateArrayBuffer(binaryFile, imports, callback);
            });
          }
        );
      }
      return instantiateArrayBuffer(binaryFile, imports, callback);
    }
    function getWasmImports() {
      return { a: wasmImports };
    }
    function createWasm() {
      var info = getWasmImports();
      function receiveInstance(instance, module) {
        wasmExports = instance.exports;
        wasmExports = Asyncify.instrumentWasmExports(wasmExports);
        wasmTable = wasmExports["S"];
        addOnInit(wasmExports["Q"]);
        removeRunDependency("wasm-instantiate");
        return wasmExports;
      }
      addRunDependency("wasm-instantiate");
      function receiveInstantiationResult(result) {
        receiveInstance(result["instance"]);
      }
      if (Module["instantiateWasm"]) {
        try {
          return Module["instantiateWasm"](info, receiveInstance);
        } catch (e) {
          err(`Module.instantiateWasm callback failed with error: ${e}`);
          readyPromiseReject(e);
        }
      }
      if (!wasmBinaryFile) wasmBinaryFile = findWasmBinary();
      instantiateAsync(
        wasmBinary,
        wasmBinaryFile,
        info,
        receiveInstantiationResult
      ).catch(readyPromiseReject);
      return {};
    }
    var tempDouble;
    var tempI64;
    var ASM_CONSTS = {
      381052: () => {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        var contextForCheck = new AudioContext();
        if (!contextForCheck) {
          return 0;
        }
        var retValue = 0;
        if (self.AudioWorkletNode) {
          if (contextForCheck.audioWorklet.addModule) {
            retValue = 1;
          }
        }
        contextForCheck.close();
        return retValue;
      },
      381356: () => {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        var infocontext = new AudioContext();
        if (!infocontext) {
          return 0;
        }
        var inforate = infocontext.sampleRate;
        infocontext.close();
        return inforate;
      },
      381576: () => {
        Module.mInputRegistered = false;
      },
      381613: () => {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        Module.context = new AudioContext();
        if (!Module.context) {
          return 0;
        }
        Module.FMOD_JS_MixFunction = Module["cwrap"](
          "FMOD_JS_MixFunction",
          "void",
          ["number"]
        );
        return Module.context.sampleRate;
      },
      381881: ($0, $1) => {
        Module._as_script_node = Module.context.createScriptProcessor(
          $1,
          0,
          $0
        );
        Module["OutputWebAudio_resumeAudio"] = function () {
          if (Module.context && Module.mInputRegistered) {
            console.log("Resetting audio driver based on user input.");
            Module._as_script_node.connect(Module.context.destination);
            Module._as_script_node.onaudioprocess = function (
              audioProcessingEvent
            ) {
              Module._as_output_buffer = audioProcessingEvent.outputBuffer;
              Module.FMOD_JS_MixFunction(
                Module._as_output_buffer.getChannelData(0).length
              );
            };
            Module.context.resume();
            window.removeEventListener(
              "click",
              Module.OutputWebAudio_resumeAudio,
              false
            );
            window.removeEventListener(
              "touchend",
              Module.OutputWebAudio_resumeAudio,
              false
            );
            Module.mInputRegistered = false;
          }
        };
      },
      382621: () => {
        if (Module.mInputRegistered) {
          Module.mInputRegistered = false;
          window.removeEventListener(
            "click",
            Module["OutputWebAudio_resumeAudio"],
            false
          );
          window.removeEventListener(
            "touchend",
            Module["OutputWebAudio_resumeAudio"],
            false
          );
        }
      },
      382858: () => {
        window.addEventListener(
          "touchend",
          Module["OutputWebAudio_resumeAudio"],
          false
        );
        window.addEventListener(
          "click",
          Module["OutputWebAudio_resumeAudio"],
          false
        );
        Module.mInputRegistered = true;
      },
      383055: () => {
        Module._as_script_node.disconnect(Module.context.destination);
      },
      383122: ($0, $1, $2, $3) => {
        var data = HEAPF32.subarray($0 / 4, $0 / 4 + $2 * $3);
        for (var channel = 0; channel < $3; channel++) {
          var outputData = Module._as_output_buffer.getChannelData(channel);
          for (var sample = 0; sample < $2; sample++) {
            outputData[sample + $1] = data[sample * $3 + channel];
          }
        }
      },
      383404: () => {
        Module.context.suspend();
      },
      383434: () => {
        Module.context.resume();
      },
      383463: () => {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        var infocontext = new AudioContext();
        if (!infocontext) {
          return 0;
        }
        var inforate = infocontext.sampleRate;
        infocontext.close();
        return inforate;
      },
      383683: () => {
        Module.mWorkletNode = null;
        Module.mModulePolling = false;
        Module.mModuleLoading = false;
        Module.mStartInterval = null;
        Module.mStopInterval = null;
        Module.mSuspendInterval = null;
        Module.mResumeInterval = null;
        Module.mWorkletNodeConnected = false;
        Module.mInputRegistered = false;
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        Module.mContext = new AudioContext();
        if (!Module.mContext) {
          return 0;
        }
        Module.mContext.destination.channelCount =
          Module.mContext.destination.maxChannelCount;
        return Module.mContext.destination.maxChannelCount;
      },
      384253: ($0) => {
        const initAddModuleRef = $0;
        if (!initAddModuleRef) {
          Module.mAddModuleRef = 0;
        }
        if (!self.AudioWorkletNode) {
          return -1;
        }
        if (!Module.mContext.audioWorklet.addModule) {
          return -2;
        }
        Module.FMOD_JS_MixerSlowpathFunction = Module["cwrap"](
          "FMOD_JS_MixerSlowpathFunction",
          "void",
          []
        );
        Module.FMOD_JS_MixerFastpathFunction = Module["cwrap"](
          "FMOD_JS_MixerFastpathFunction",
          "void",
          ["number"]
        );
        return Module.mContext.sampleRate;
      },
      384687: ($0, $1) => {
        Module.mSpeakerChannelCount = $0;
        const bufferLength = $1;
        Module.mUrl = null;
        Module.mOutputData = null;
        Module.mSharedArrayBuffers = false;
        if (self.SharedArrayBuffer) {
          if (self.crossOriginIsolated) {
            Module.mSharedArrayBuffers = true;
          }
        }
        if (!Module.mSharedArrayBuffers) {
          const slowCodePath = new Blob(
            [
              "class AudioProcessor extends AudioWorkletProcessor",
              "{",
              "constructor(options)",
              "{",
              "super();",
              "this.payload = [null, null];",
              "this.bufferFlag = 0;",
              "this.dataFlag = 0;",
              "this.bufferIndex = 0;",
              "this.bufferSize = 0;",
              "this.channelCount = options.outputChannelCount;",
              "this.port.onmessage = (event) => {",
              "const { data } = event;",
              "if (data)",
              "{",
              "this.payload[this.dataFlag] = new Float32Array(data);",
              "this.bufferSize = data.length / this.channelCount;",
              "}",
              "else",
              "{",
              "this.payload[this.dataFlag] = null;",
              "}",
              "this.dataFlag ^= 1;",
              "};",
              "}",
              "process(inputs, outputs, parameters)",
              "{",
              "const output = outputs[0];",
              "if (output.length === 0) return true;",
              "if (this.payload[this.bufferFlag]) {",
              "if (this.bufferIndex === 0) {",
              "this.port.postMessage(this.bufferSize);",
              "}",
              "const bufferSliceEnd = this.bufferSize / output[0].length;",
              "const sliceOffset = output[0].length * this.bufferIndex;",
              "for (let channel = 0; channel < output.length; ++channel) {",
              "const outputChannel = output[channel];",
              "const indexOffset = this.bufferSize * channel + sliceOffset;",
              "outputChannel.set(new Float32Array(this.payload[this.bufferFlag].slice(0 + indexOffset, outputChannel.length + indexOffset)));",
              "}",
              "this.bufferIndex++;",
              "if (this.bufferIndex === bufferSliceEnd) {",
              "this.bufferIndex = 0;",
              "this.bufferFlag ^= 1;",
              "}",
              "}",
              "return true;",
              "}",
              "}",
              "registerProcessor('audio-processor', AudioProcessor);",
            ],
            { type: "application/javascript" }
          );
          Module.mUrl = URL.createObjectURL(slowCodePath);
          Module.mOutputData = new Float32Array(
            Module.mSpeakerChannelCount * bufferLength
          );
        } else {
          const fastCodePath = new Blob(
            [
              "class AudioProcessor extends AudioWorkletProcessor",
              "{",
              "constructor(options)",
              "{",
              "super();",
              "this.payload = null;",
              "this.bufferFlag = 0;",
              "this.bufferIndex = 0;",
              "this.bufferSize = 0;",
              "this.bufferOffset = 0;",
              "this.channelCount = options.outputChannelCount;",
              "this.port.onmessage = (event) => {",
              "const { data } = event;",
              "if (data)",
              "{",
              "this.payload = data;",
              "this.bufferSize = this.payload.length / (this.channelCount * 2);",
              "this.bufferOffset = this.payload.length / 2;",
              "}",
              "else",
              "{",
              "this.payload = null;",
              "}",
              "};",
              "}",
              "process(inputs, outputs, parameters)",
              "{",
              "const output = outputs[0];",
              "if (output.length === 0) return true;",
              "if (this.payload) {",
              "if (this.bufferIndex === 0) {",
              "this.port.postMessage(this.bufferFlag ^ 1);",
              "}",
              "const bufferSliceEnd = this.bufferSize / output[0].length;",
              "const sliceOffset = output[0].length * this.bufferIndex + this.bufferOffset * this.bufferFlag;",
              "for (let channel = 0; channel < output.length; ++channel) {",
              "const outputChannel = output[channel];",
              "const indexOffset = this.bufferSize * channel + sliceOffset;",
              "outputChannel.set(new Float32Array(this.payload.slice(0 + indexOffset, outputChannel.length + indexOffset)));",
              "}",
              "this.bufferIndex++;",
              "if (this.bufferIndex === bufferSliceEnd) {",
              "this.bufferIndex = 0;",
              "this.bufferFlag ^= 1;",
              "}",
              "}",
              "return true;",
              "}",
              "}",
              "registerProcessor('audio-processor', AudioProcessor);",
            ],
            { type: "application/javascript" }
          );
          Module.mUrl = URL.createObjectURL(fastCodePath);
          Module.mOutputData = new Float32Array(
            new SharedArrayBuffer(
              Float32Array.BYTES_PER_ELEMENT *
                Module.mSpeakerChannelCount *
                bufferLength *
                2
            )
          );
        }
        Module.mModulePolling = true;
        Module["waitForAudioWorklet"] = function (condition, callback) {
          var myInterval = null;
          if (condition()) {
            myInterval = setInterval(function () {
              if (!condition()) {
                callback();
                clearInterval(myInterval);
              }
            }, 50);
          } else {
            callback();
            return null;
          }
          return myInterval;
        };
        Module["OutputAudioWorklet_resumeAudio"] = function () {
          if (Module.mContext && Module.mInputRegistered) {
            console.log("Resetting audio driver based on user input.");
            Module.mContext.resume();
            window.removeEventListener(
              "click",
              Module.OutputAudioWorklet_resumeAudio,
              false
            );
            window.removeEventListener(
              "touchend",
              Module.OutputAudioWorklet_resumeAudio,
              false
            );
            Module.mInputRegistered = false;
            if (!Module.mModuleLoading) {
              Module.mModuleLoading = true;
              Module.mAddModuleRef++;
              Module.mContext
                .resume()
                .then(function () {
                  Module.mContext.audioWorklet
                    .addModule(Module.mUrl)
                    .then(function () {
                      if (Module.mAddModuleRef === 1) {
                        Module.mWorkletNode = new AudioWorkletNode(
                          Module.mContext,
                          "audio-processor",
                          { outputChannelCount: [Module.mSpeakerChannelCount] }
                        );
                        Module.mModulePolling = false;
                        URL.revokeObjectURL(Module.mUrl);
                        if (Module.mWorkletNode) {
                          Module.mWorkletNode.port.postMessage(
                            Module.mOutputData
                          );
                          if (Module.mSharedArrayBuffers) {
                            Module.mWorkletNode.port.onmessage = function (
                              event
                            ) {
                              Module.FMOD_JS_MixerFastpathFunction(event.data);
                            };
                          } else {
                            Module.mWorkletNode.port.onmessage = function (
                              event
                            ) {
                              Module.FMOD_JS_MixerSlowpathFunction();
                              Module.mWorkletNode.port.postMessage(
                                Module.mOutputData
                              );
                            };
                          }
                        } else {
                          console.log(
                            "Error when creating AudioWorkletNode: Null object"
                          );
                        }
                      }
                      Module.mAddModuleRef--;
                    })
                    .catch(function (err) {
                      Module.mModulePolling = false;
                      Module.mAddModuleRef--;
                      console.log("Error when opening audio processor ");
                      console.log(err);
                    });
                })
                .catch(function (err) {
                  Module.mModulePolling = false;
                  Module.mAddModuleRef--;
                  console.log("Error with mContext.resume()");
                  console.log(err);
                });
            }
          }
        };
        return Module.mSharedArrayBuffers;
      },
      390298: () => {
        window.addEventListener(
          "touchend",
          Module["OutputAudioWorklet_resumeAudio"],
          false
        );
        window.addEventListener(
          "click",
          Module["OutputAudioWorklet_resumeAudio"],
          false
        );
        Module.mInputRegistered = true;
      },
      390503: () => {
        if (Module.mStartInterval) {
          clearInterval(Module.mStartInterval);
        }
        if (Module.mStopInterval) {
          clearInterval(Module.mStopInterval);
        }
        if (Module.mSuspendInterval) {
          clearInterval(Module.mSuspendInterval);
        }
        if (Module.mResumeInterval) {
          clearInterval(Module.mResumeInterval);
        }
        if (Module.mWorkletNode) {
          if (Module.mWorkletNodeConnected) {
            Module.mWorkletNode.disconnect();
          }
        }
        if (Module.mContext) {
          Module.mContext.close();
        }
        if (Module.mInputRegistered) {
          Module.mInputRegistered = false;
          window.removeEventListener(
            "click",
            Module["OutputAudioWorklet_resumeAudio"],
            false
          );
          window.removeEventListener(
            "touchend",
            Module["OutputAudioWorklet_resumeAudio"],
            false
          );
        }
      },
      391179: () => {
        Module.mStartInterval = Module["waitForAudioWorklet"](
          function () {
            return Module.mWorkletNode === null && Module.mModulePolling;
          },
          function () {
            if (Module.mWorkletNode) {
              Module.mWorkletNode.connect(Module.mContext.destination);
              Module.mWorkletNodeConnected = true;
            }
          }
        );
      },
      391456: () => {
        Module.mStopInterval = Module["waitForAudioWorklet"](
          function () {
            return (
              (Module.mWorkletNode === null && Module.mModulePolling) ||
              !Module.mWorkletNodeConnected
            );
          },
          function () {
            if (Module.mWorkletNode) {
              Module.mWorkletNode.disconnect();
              Module.mWorkletNodeConnected = false;
            }
          }
        );
      },
      391742: ($0, $1, $2) => {
        const buffer = $0;
        const bufferLength = $1;
        const speakerModeChannels = $2;
        var data = HEAPF32.subarray(
          buffer / 4,
          buffer / 4 + bufferLength * speakerModeChannels
        );
        for (var channel = 0; channel < speakerModeChannels; channel++) {
          const offset = channel * bufferLength;
          for (var sample = 0; sample < bufferLength; sample++) {
            Module.mOutputData[sample + offset] =
              data[sample * speakerModeChannels + channel];
          }
        }
      },
      392169: ($0, $1, $2, $3) => {
        const buffer = $0;
        const bufferLength = $1;
        const speakerModeChannels = $2;
        const frameFlag = $3;
        var data = HEAPF32.subarray(
          buffer / 4,
          buffer / 4 + bufferLength * speakerModeChannels
        );
        const arrayOffset = speakerModeChannels * frameFlag * bufferLength;
        for (var channel = 0; channel < speakerModeChannels; channel++) {
          const offset = channel * bufferLength + arrayOffset;
          for (var sample = 0; sample < bufferLength; sample++) {
            Module.mOutputData[sample + offset] =
              data[sample * speakerModeChannels + channel];
          }
        }
      },
      392700: () => {
        if (Module.mContext) {
          Module.mContext.suspend();
        }
      },
      392756: () => {
        if (Module.mContext) {
          Module.mContext.resume();
        }
      },
    };
    function ExitStatus(status) {
      this.name = "ExitStatus";
      this.message = `Program terminated with exit(${status})`;
      this.status = status;
    }
    var callRuntimeCallbacks = (callbacks) => {
      while (callbacks.length > 0) {
        callbacks.shift()(Module);
      }
    };
    function getValue(ptr, type = "i8") {
      if (type.endsWith("*")) type = "*";
      switch (type) {
        case "i1":
          return HEAP8[ptr];
        case "i8":
          return HEAP8[ptr];
        case "i16":
          return HEAP16[ptr >> 1];
        case "i32":
          return HEAP32[ptr >> 2];
        case "i64":
          abort("to do getValue(i64) use WASM_BIGINT");
        case "float":
          return HEAPF32[ptr >> 2];
        case "double":
          return HEAPF64[ptr >> 3];
        case "*":
          return HEAPU32[ptr >> 2];
        default:
          abort(`invalid type for getValue: ${type}`);
      }
    }
    var noExitRuntime = Module["noExitRuntime"] || true;
    function setValue(ptr, value, type = "i8") {
      if (type.endsWith("*")) type = "*";
      switch (type) {
        case "i1":
          HEAP8[ptr] = value;
          break;
        case "i8":
          HEAP8[ptr] = value;
          break;
        case "i16":
          HEAP16[ptr >> 1] = value;
          break;
        case "i32":
          HEAP32[ptr >> 2] = value;
          break;
        case "i64":
          abort("to do setValue(i64) use WASM_BIGINT");
        case "float":
          HEAPF32[ptr >> 2] = value;
          break;
        case "double":
          HEAPF64[ptr >> 3] = value;
          break;
        case "*":
          HEAPU32[ptr >> 2] = value;
          break;
        default:
          abort(`invalid type for setValue: ${type}`);
      }
    }
    var stackRestore = (val) => __emscripten_stack_restore(val);
    var stackSave = () => _emscripten_stack_get_current();
    function syscallGetVarargI() {
      var ret = HEAP32[+SYSCALLS.varargs >> 2];
      SYSCALLS.varargs += 4;
      return ret;
    }
    var syscallGetVarargP = syscallGetVarargI;
    var PATH = {
      isAbs: (path) => path.charAt(0) === "/",
      splitPath: (filename) => {
        var splitPathRe =
          /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },
      normalizeArray: (parts, allowAboveRoot) => {
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === ".") {
            parts.splice(i, 1);
          } else if (last === "..") {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        if (allowAboveRoot) {
          for (; up; up--) {
            parts.unshift("..");
          }
        }
        return parts;
      },
      normalize: (path) => {
        var isAbsolute = PATH.isAbs(path),
          trailingSlash = path.substr(-1) === "/";
        path = PATH.normalizeArray(
          path.split("/").filter((p) => !!p),
          !isAbsolute
        ).join("/");
        if (!path && !isAbsolute) {
          path = ".";
        }
        if (path && trailingSlash) {
          path += "/";
        }
        return (isAbsolute ? "/" : "") + path;
      },
      dirname: (path) => {
        var result = PATH.splitPath(path),
          root = result[0],
          dir = result[1];
        if (!root && !dir) {
          return ".";
        }
        if (dir) {
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },
      basename: (path) => {
        if (path === "/") return "/";
        path = PATH.normalize(path);
        path = path.replace(/\/$/, "");
        var lastSlash = path.lastIndexOf("/");
        if (lastSlash === -1) return path;
        return path.substr(lastSlash + 1);
      },
      join: (...paths) => PATH.normalize(paths.join("/")),
      join2: (l, r) => PATH.normalize(l + "/" + r),
    };
    var initRandomFill = () => {
      if (
        typeof crypto == "object" &&
        typeof crypto["getRandomValues"] == "function"
      ) {
        return (view) => crypto.getRandomValues(view);
      } else if (ENVIRONMENT_IS_NODE) {
        try {
          var crypto_module = require("crypto");
          var randomFillSync = crypto_module["randomFillSync"];
          if (randomFillSync) {
            return (view) => crypto_module["randomFillSync"](view);
          }
          var randomBytes = crypto_module["randomBytes"];
          return (view) => (view.set(randomBytes(view.byteLength)), view);
        } catch (e) {}
      }
      abort("initRandomDevice");
    };
    var randomFill = (view) => (randomFill = initRandomFill())(view);
    var PATH_FS = {
      resolve: (...args) => {
        var resolvedPath = "",
          resolvedAbsolute = false;
        for (var i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = i >= 0 ? args[i] : FS.cwd();
          if (typeof path != "string") {
            throw new TypeError("Arguments to path.resolve must be strings");
          } else if (!path) {
            return "";
          }
          resolvedPath = path + "/" + resolvedPath;
          resolvedAbsolute = PATH.isAbs(path);
        }
        resolvedPath = PATH.normalizeArray(
          resolvedPath.split("/").filter((p) => !!p),
          !resolvedAbsolute
        ).join("/");
        return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
      },
      relative: (from, to) => {
        from = PATH_FS.resolve(from).substr(1);
        to = PATH_FS.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== "") break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== "") break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split("/"));
        var toParts = trim(to.split("/"));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push("..");
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join("/");
      },
    };
    var UTF8Decoder =
      typeof TextDecoder != "undefined" ? new TextDecoder() : undefined;
    var UTF8ArrayToString = (heapOrArray, idx, maxBytesToRead) => {
      var endIdx = idx + maxBytesToRead;
      var endPtr = idx;
      while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
      if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
        return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
      }
      var str = "";
      while (idx < endPtr) {
        var u0 = heapOrArray[idx++];
        if (!(u0 & 128)) {
          str += String.fromCharCode(u0);
          continue;
        }
        var u1 = heapOrArray[idx++] & 63;
        if ((u0 & 224) == 192) {
          str += String.fromCharCode(((u0 & 31) << 6) | u1);
          continue;
        }
        var u2 = heapOrArray[idx++] & 63;
        if ((u0 & 240) == 224) {
          u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
        } else {
          u0 =
            ((u0 & 7) << 18) |
            (u1 << 12) |
            (u2 << 6) |
            (heapOrArray[idx++] & 63);
        }
        if (u0 < 65536) {
          str += String.fromCharCode(u0);
        } else {
          var ch = u0 - 65536;
          str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
        }
      }
      return str;
    };
    var FS_stdin_getChar_buffer = [];
    var lengthBytesUTF8 = (str) => {
      var len = 0;
      for (var i = 0; i < str.length; ++i) {
        var c = str.charCodeAt(i);
        if (c <= 127) {
          len++;
        } else if (c <= 2047) {
          len += 2;
        } else if (c >= 55296 && c <= 57343) {
          len += 4;
          ++i;
        } else {
          len += 3;
        }
      }
      return len;
    };
    var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
      if (!(maxBytesToWrite > 0)) return 0;
      var startIdx = outIdx;
      var endIdx = outIdx + maxBytesToWrite - 1;
      for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) {
          var u1 = str.charCodeAt(++i);
          u = (65536 + ((u & 1023) << 10)) | (u1 & 1023);
        }
        if (u <= 127) {
          if (outIdx >= endIdx) break;
          heap[outIdx++] = u;
        } else if (u <= 2047) {
          if (outIdx + 1 >= endIdx) break;
          heap[outIdx++] = 192 | (u >> 6);
          heap[outIdx++] = 128 | (u & 63);
        } else if (u <= 65535) {
          if (outIdx + 2 >= endIdx) break;
          heap[outIdx++] = 224 | (u >> 12);
          heap[outIdx++] = 128 | ((u >> 6) & 63);
          heap[outIdx++] = 128 | (u & 63);
        } else {
          if (outIdx + 3 >= endIdx) break;
          heap[outIdx++] = 240 | (u >> 18);
          heap[outIdx++] = 128 | ((u >> 12) & 63);
          heap[outIdx++] = 128 | ((u >> 6) & 63);
          heap[outIdx++] = 128 | (u & 63);
        }
      }
      heap[outIdx] = 0;
      return outIdx - startIdx;
    };
    function intArrayFromString(stringy, dontAddNull, length) {
      var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
      var u8array = new Array(len);
      var numBytesWritten = stringToUTF8Array(
        stringy,
        u8array,
        0,
        u8array.length
      );
      if (dontAddNull) u8array.length = numBytesWritten;
      return u8array;
    }
    var FS_stdin_getChar = () => {
      if (!FS_stdin_getChar_buffer.length) {
        var result = null;
        if (ENVIRONMENT_IS_NODE) {
          var BUFSIZE = 256;
          var buf = Buffer.alloc(BUFSIZE);
          var bytesRead = 0;
          var fd = process.stdin.fd;
          try {
            bytesRead = fs.readSync(fd, buf, 0, BUFSIZE);
          } catch (e) {
            if (e.toString().includes("EOF")) bytesRead = 0;
            else throw e;
          }
          if (bytesRead > 0) {
            result = buf.slice(0, bytesRead).toString("utf-8");
          }
        } else if (
          typeof window != "undefined" &&
          typeof window.prompt == "function"
        ) {
          result = window.prompt("Input: ");
          if (result !== null) {
            result += "\n";
          }
        } else {
        }
        if (!result) {
          return null;
        }
        FS_stdin_getChar_buffer = intArrayFromString(result, true);
      }
      return FS_stdin_getChar_buffer.shift();
    };
    var TTY = {
      ttys: [],
      init() {},
      shutdown() {},
      register(dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },
      stream_ops: {
        open(stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(43);
          }
          stream.tty = tty;
          stream.seekable = false;
        },
        close(stream) {
          stream.tty.ops.fsync(stream.tty);
        },
        fsync(stream) {
          stream.tty.ops.fsync(stream.tty);
        },
        read(stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(60);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(29);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(6);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset + i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },
        write(stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(60);
          }
          try {
            for (var i = 0; i < length; i++) {
              stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
            }
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        },
      },
      default_tty_ops: {
        get_char(tty) {
          return FS_stdin_getChar();
        },
        put_char(tty, val) {
          if (val === null || val === 10) {
            out(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val);
          }
        },
        fsync(tty) {
          if (tty.output && tty.output.length > 0) {
            out(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        },
        ioctl_tcgets(tty) {
          return {
            c_iflag: 25856,
            c_oflag: 5,
            c_cflag: 191,
            c_lflag: 35387,
            c_cc: [
              3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0,
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            ],
          };
        },
        ioctl_tcsets(tty, optional_actions, data) {
          return 0;
        },
        ioctl_tiocgwinsz(tty) {
          return [24, 80];
        },
      },
      default_tty1_ops: {
        put_char(tty, val) {
          if (val === null || val === 10) {
            err(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val);
          }
        },
        fsync(tty) {
          if (tty.output && tty.output.length > 0) {
            err(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        },
      },
    };
    var alignMemory = (size, alignment) =>
      Math.ceil(size / alignment) * alignment;
    var mmapAlloc = (size) => {
      abort();
    };
    var MEMFS = {
      ops_table: null,
      mount(mount) {
        return MEMFS.createNode(null, "/", 16384 | 511, 0);
      },
      createNode(parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          throw new FS.ErrnoError(63);
        }
        MEMFS.ops_table ||= {
          dir: {
            node: {
              getattr: MEMFS.node_ops.getattr,
              setattr: MEMFS.node_ops.setattr,
              lookup: MEMFS.node_ops.lookup,
              mknod: MEMFS.node_ops.mknod,
              rename: MEMFS.node_ops.rename,
              unlink: MEMFS.node_ops.unlink,
              rmdir: MEMFS.node_ops.rmdir,
              readdir: MEMFS.node_ops.readdir,
              symlink: MEMFS.node_ops.symlink,
            },
            stream: { llseek: MEMFS.stream_ops.llseek },
          },
          file: {
            node: {
              getattr: MEMFS.node_ops.getattr,
              setattr: MEMFS.node_ops.setattr,
            },
            stream: {
              llseek: MEMFS.stream_ops.llseek,
              read: MEMFS.stream_ops.read,
              write: MEMFS.stream_ops.write,
              allocate: MEMFS.stream_ops.allocate,
              mmap: MEMFS.stream_ops.mmap,
              msync: MEMFS.stream_ops.msync,
            },
          },
          link: {
            node: {
              getattr: MEMFS.node_ops.getattr,
              setattr: MEMFS.node_ops.setattr,
              readlink: MEMFS.node_ops.readlink,
            },
            stream: {},
          },
          chrdev: {
            node: {
              getattr: MEMFS.node_ops.getattr,
              setattr: MEMFS.node_ops.setattr,
            },
            stream: FS.chrdev_stream_ops,
          },
        };
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.usedBytes = 0;
          node.contents = null;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        if (parent) {
          parent.contents[name] = node;
          parent.timestamp = node.timestamp;
        }
        return node;
      },
      getFileDataAsTypedArray(node) {
        if (!node.contents) return new Uint8Array(0);
        if (node.contents.subarray)
          return node.contents.subarray(0, node.usedBytes);
        return new Uint8Array(node.contents);
      },
      expandFileStorage(node, newCapacity) {
        var prevCapacity = node.contents ? node.contents.length : 0;
        if (prevCapacity >= newCapacity) return;
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(
          newCapacity,
          (prevCapacity *
            (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125)) >>>
            0
        );
        if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
        var oldContents = node.contents;
        node.contents = new Uint8Array(newCapacity);
        if (node.usedBytes > 0)
          node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
      },
      resizeFileStorage(node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
          node.contents = null;
          node.usedBytes = 0;
        } else {
          var oldContents = node.contents;
          node.contents = new Uint8Array(newSize);
          if (oldContents) {
            node.contents.set(
              oldContents.subarray(0, Math.min(newSize, node.usedBytes))
            );
          }
          node.usedBytes = newSize;
        }
      },
      node_ops: {
        getattr(node) {
          var attr = {};
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.usedBytes;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },
        setattr(node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.resizeFileStorage(node, attr.size);
          }
        },
        lookup(parent, name) {
          throw FS.genericErrors[44];
        },
        mknod(parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },
        rename(old_node, new_dir, new_name) {
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {}
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(55);
              }
            }
          }
          delete old_node.parent.contents[old_node.name];
          old_node.parent.timestamp = Date.now();
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          new_dir.timestamp = old_node.parent.timestamp;
        },
        unlink(parent, name) {
          delete parent.contents[name];
          parent.timestamp = Date.now();
        },
        rmdir(parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(55);
          }
          delete parent.contents[name];
          parent.timestamp = Date.now();
        },
        readdir(node) {
          var entries = [".", ".."];
          for (var key of Object.keys(node.contents)) {
            entries.push(key);
          }
          return entries;
        },
        symlink(parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
          node.link = oldpath;
          return node;
        },
        readlink(node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(28);
          }
          return node.link;
        },
      },
      stream_ops: {
        read(stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= stream.node.usedBytes) return 0;
          var size = Math.min(stream.node.usedBytes - position, length);
          if (size > 8 && contents.subarray) {
            buffer.set(contents.subarray(position, position + size), offset);
          } else {
            for (var i = 0; i < size; i++)
              buffer[offset + i] = contents[position + i];
          }
          return size;
        },
        write(stream, buffer, offset, length, position, canOwn) {
          if (buffer.buffer === HEAP8.buffer) {
            canOwn = false;
          }
          if (!length) return 0;
          var node = stream.node;
          node.timestamp = Date.now();
          if (buffer.subarray && (!node.contents || node.contents.subarray)) {
            if (canOwn) {
              node.contents = buffer.subarray(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (node.usedBytes === 0 && position === 0) {
              node.contents = buffer.slice(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (position + length <= node.usedBytes) {
              node.contents.set(
                buffer.subarray(offset, offset + length),
                position
              );
              return length;
            }
          }
          MEMFS.expandFileStorage(node, position + length);
          if (node.contents.subarray && buffer.subarray) {
            node.contents.set(
              buffer.subarray(offset, offset + length),
              position
            );
          } else {
            for (var i = 0; i < length; i++) {
              node.contents[position + i] = buffer[offset + i];
            }
          }
          node.usedBytes = Math.max(node.usedBytes, position + length);
          return length;
        },
        llseek(stream, offset, whence) {
          var position = offset;
          if (whence === 1) {
            position += stream.position;
          } else if (whence === 2) {
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.usedBytes;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(28);
          }
          return position;
        },
        allocate(stream, offset, length) {
          MEMFS.expandFileStorage(stream.node, offset + length);
          stream.node.usedBytes = Math.max(
            stream.node.usedBytes,
            offset + length
          );
        },
        mmap(stream, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          if (!(flags & 2) && contents && contents.buffer === HEAP8.buffer) {
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            allocated = true;
            ptr = mmapAlloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(48);
            }
            if (contents) {
              if (position > 0 || position + length < contents.length) {
                if (contents.subarray) {
                  contents = contents.subarray(position, position + length);
                } else {
                  contents = Array.prototype.slice.call(
                    contents,
                    position,
                    position + length
                  );
                }
              }
              HEAP8.set(contents, ptr);
            }
          }
          return { ptr, allocated };
        },
        msync(stream, buffer, offset, length, mmapFlags) {
          MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
          return 0;
        },
      },
    };
    var asyncLoad = (url, onload, onerror, noRunDep) => {
      var dep = !noRunDep ? getUniqueRunDependency(`al ${url}`) : "";
      readAsync(url).then(
        (arrayBuffer) => {
          onload(new Uint8Array(arrayBuffer));
          if (dep) removeRunDependency(dep);
        },
        (err) => {
          if (onerror) {
            onerror();
          } else {
            throw `Loading data file "${url}" failed.`;
          }
        }
      );
      if (dep) addRunDependency(dep);
    };
    var FS_createDataFile = (
      parent,
      name,
      fileData,
      canRead,
      canWrite,
      canOwn
    ) => {
      FS.createDataFile(parent, name, fileData, canRead, canWrite, canOwn);
    };
    var preloadPlugins = Module["preloadPlugins"] || [];
    var FS_handledByPreloadPlugin = (byteArray, fullname, finish, onerror) => {
      if (typeof Browser != "undefined") Browser.init();
      var handled = false;
      preloadPlugins.forEach((plugin) => {
        if (handled) return;
        if (plugin["canHandle"](fullname)) {
          plugin["handle"](byteArray, fullname, finish, onerror);
          handled = true;
        }
      });
      return handled;
    };
    var FS_createPreloadedFile = (
      parent,
      name,
      url,
      canRead,
      canWrite,
      onload,
      onerror,
      dontCreateFile,
      canOwn,
      preFinish
    ) => {
      var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
      var dep = getUniqueRunDependency(`cp ${fullname}`);
      function processData(byteArray) {
        function finish(byteArray) {
          preFinish?.();
          if (!dontCreateFile) {
            FS_createDataFile(
              parent,
              name,
              byteArray,
              canRead,
              canWrite,
              canOwn
            );
          }
          onload?.();
          removeRunDependency(dep);
        }
        if (
          FS_handledByPreloadPlugin(byteArray, fullname, finish, () => {
            onerror?.();
            removeRunDependency(dep);
          })
        ) {
          return;
        }
        finish(byteArray);
      }
      addRunDependency(dep);
      if (typeof url == "string") {
        asyncLoad(url, processData, onerror);
      } else {
        processData(url);
      }
    };
    var FS_modeStringToFlags = (str) => {
      var flagModes = {
        r: 0,
        "r+": 2,
        w: 512 | 64 | 1,
        "w+": 512 | 64 | 2,
        a: 1024 | 64 | 1,
        "a+": 1024 | 64 | 2,
      };
      var flags = flagModes[str];
      if (typeof flags == "undefined") {
        throw new Error(`Unknown file open mode: ${str}`);
      }
      return flags;
    };
    var FS_getMode = (canRead, canWrite) => {
      var mode = 0;
      if (canRead) mode |= 292 | 73;
      if (canWrite) mode |= 146;
      return mode;
    };
    var FS = {
      root: null,
      mounts: [],
      devices: {},
      streams: [],
      nextInode: 1,
      nameTable: null,
      currentPath: "/",
      initialized: false,
      ignorePermissions: true,
      ErrnoError: class {
        constructor(errno) {
          this.name = "ErrnoError";
          this.errno = errno;
        }
      },
      genericErrors: {},
      filesystems: null,
      syncFSRequests: 0,
      FSStream: class {
        constructor() {
          this.shared = {};
        }
        get object() {
          return this.node;
        }
        set object(val) {
          this.node = val;
        }
        get isRead() {
          return (this.flags & 2097155) !== 1;
        }
        get isWrite() {
          return (this.flags & 2097155) !== 0;
        }
        get isAppend() {
          return this.flags & 1024;
        }
        get flags() {
          return this.shared.flags;
        }
        set flags(val) {
          this.shared.flags = val;
        }
        get position() {
          return this.shared.position;
        }
        set position(val) {
          this.shared.position = val;
        }
      },
      FSNode: class {
        constructor(parent, name, mode, rdev) {
          if (!parent) {
            parent = this;
          }
          this.parent = parent;
          this.mount = parent.mount;
          this.mounted = null;
          this.id = FS.nextInode++;
          this.name = name;
          this.mode = mode;
          this.node_ops = {};
          this.stream_ops = {};
          this.rdev = rdev;
          this.readMode = 292 | 73;
          this.writeMode = 146;
        }
        get read() {
          return (this.mode & this.readMode) === this.readMode;
        }
        set read(val) {
          val ? (this.mode |= this.readMode) : (this.mode &= ~this.readMode);
        }
        get write() {
          return (this.mode & this.writeMode) === this.writeMode;
        }
        set write(val) {
          val ? (this.mode |= this.writeMode) : (this.mode &= ~this.writeMode);
        }
        get isFolder() {
          return FS.isDir(this.mode);
        }
        get isDevice() {
          return FS.isChrdev(this.mode);
        }
      },
      lookupPath(path, opts = {}) {
        path = PATH_FS.resolve(path);
        if (!path) return { path: "", node: null };
        var defaults = { follow_mount: true, recurse_count: 0 };
        opts = Object.assign(defaults, opts);
        if (opts.recurse_count > 8) {
          throw new FS.ErrnoError(32);
        }
        var parts = path.split("/").filter((p) => !!p);
        var current = FS.root;
        var current_path = "/";
        for (var i = 0; i < parts.length; i++) {
          var islast = i === parts.length - 1;
          if (islast && opts.parent) {
            break;
          }
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
              var lookup = FS.lookupPath(current_path, {
                recurse_count: opts.recurse_count + 1,
              });
              current = lookup.node;
              if (count++ > 40) {
                throw new FS.ErrnoError(32);
              }
            }
          }
        }
        return { path: current_path, node: current };
      },
      getPath(node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length - 1] !== "/"
              ? `${mount}/${path}`
              : mount + path;
          }
          path = path ? `${node.name}/${path}` : node.name;
          node = node.parent;
        }
      },
      hashName(parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },
      hashAddNode(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },
      hashRemoveNode(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },
      lookupNode(parent, name) {
        var errCode = FS.mayLookup(parent);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        return FS.lookup(parent, name);
      },
      createNode(parent, name, mode, rdev) {
        var node = new FS.FSNode(parent, name, mode, rdev);
        FS.hashAddNode(node);
        return node;
      },
      destroyNode(node) {
        FS.hashRemoveNode(node);
      },
      isRoot(node) {
        return node === node.parent;
      },
      isMountpoint(node) {
        return !!node.mounted;
      },
      isFile(mode) {
        return (mode & 61440) === 32768;
      },
      isDir(mode) {
        return (mode & 61440) === 16384;
      },
      isLink(mode) {
        return (mode & 61440) === 40960;
      },
      isChrdev(mode) {
        return (mode & 61440) === 8192;
      },
      isBlkdev(mode) {
        return (mode & 61440) === 24576;
      },
      isFIFO(mode) {
        return (mode & 61440) === 4096;
      },
      isSocket(mode) {
        return (mode & 49152) === 49152;
      },
      flagsToPermissionString(flag) {
        var perms = ["r", "w", "rw"][flag & 3];
        if (flag & 512) {
          perms += "w";
        }
        return perms;
      },
      nodePermissions(node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        if (perms.includes("r") && !(node.mode & 292)) {
          return 2;
        } else if (perms.includes("w") && !(node.mode & 146)) {
          return 2;
        } else if (perms.includes("x") && !(node.mode & 73)) {
          return 2;
        }
        return 0;
      },
      mayLookup(dir) {
        if (!FS.isDir(dir.mode)) return 54;
        var errCode = FS.nodePermissions(dir, "x");
        if (errCode) return errCode;
        if (!dir.node_ops.lookup) return 2;
        return 0;
      },
      mayCreate(dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return 20;
        } catch (e) {}
        return FS.nodePermissions(dir, "wx");
      },
      mayDelete(dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var errCode = FS.nodePermissions(dir, "wx");
        if (errCode) {
          return errCode;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return 54;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return 10;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return 31;
          }
        }
        return 0;
      },
      mayOpen(node, flags) {
        if (!node) {
          return 44;
        }
        if (FS.isLink(node.mode)) {
          return 32;
        } else if (FS.isDir(node.mode)) {
          if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
            return 31;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },
      MAX_OPEN_FDS: 4096,
      nextfd() {
        for (var fd = 0; fd <= FS.MAX_OPEN_FDS; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(33);
      },
      getStreamChecked(fd) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(8);
        }
        return stream;
      },
      getStream: (fd) => FS.streams[fd],
      createStream(stream, fd = -1) {
        stream = Object.assign(new FS.FSStream(), stream);
        if (fd == -1) {
          fd = FS.nextfd();
        }
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },
      closeStream(fd) {
        FS.streams[fd] = null;
      },
      dupStream(origStream, fd = -1) {
        var stream = FS.createStream(origStream, fd);
        stream.stream_ops?.dup?.(stream);
        return stream;
      },
      chrdev_stream_ops: {
        open(stream) {
          var device = FS.getDevice(stream.node.rdev);
          stream.stream_ops = device.stream_ops;
          stream.stream_ops.open?.(stream);
        },
        llseek() {
          throw new FS.ErrnoError(70);
        },
      },
      major: (dev) => dev >> 8,
      minor: (dev) => dev & 255,
      makedev: (ma, mi) => (ma << 8) | mi,
      registerDevice(dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },
      getDevice: (dev) => FS.devices[dev],
      getMounts(mount) {
        var mounts = [];
        var check = [mount];
        while (check.length) {
          var m = check.pop();
          mounts.push(m);
          check.push(...m.mounts);
        }
        return mounts;
      },
      syncfs(populate, callback) {
        if (typeof populate == "function") {
          callback = populate;
          populate = false;
        }
        FS.syncFSRequests++;
        if (FS.syncFSRequests > 1) {
          err(
            `warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`
          );
        }
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
        function doCallback(errCode) {
          FS.syncFSRequests--;
          return callback(errCode);
        }
        function done(errCode) {
          if (errCode) {
            if (!done.errored) {
              done.errored = true;
              return doCallback(errCode);
            }
            return;
          }
          if (++completed >= mounts.length) {
            doCallback(null);
          }
        }
        mounts.forEach((mount) => {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },
      mount(type, opts, mountpoint) {
        var root = mountpoint === "/";
        var pseudo = !mountpoint;
        var node;
        if (root && FS.root) {
          throw new FS.ErrnoError(10);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
          mountpoint = lookup.path;
          node = lookup.node;
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10);
          }
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(54);
          }
        }
        var mount = { type, opts, mountpoint, mounts: [] };
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          node.mounted = mount;
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
        return mountRoot;
      },
      unmount(mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(28);
        }
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
        Object.keys(FS.nameTable).forEach((hash) => {
          var current = FS.nameTable[hash];
          while (current) {
            var next = current.name_next;
            if (mounts.includes(current.mount)) {
              FS.destroyNode(current);
            }
            current = next;
          }
        });
        node.mounted = null;
        var idx = node.mount.mounts.indexOf(mount);
        node.mount.mounts.splice(idx, 1);
      },
      lookup(parent, name) {
        return parent.node_ops.lookup(parent, name);
      },
      mknod(path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === "." || name === "..") {
          throw new FS.ErrnoError(28);
        }
        var errCode = FS.mayCreate(parent, name);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },
      create(path, mode) {
        mode = mode !== undefined ? mode : 438;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },
      mkdir(path, mode) {
        mode = mode !== undefined ? mode : 511;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },
      mkdirTree(path, mode) {
        var dirs = path.split("/");
        var d = "";
        for (var i = 0; i < dirs.length; ++i) {
          if (!dirs[i]) continue;
          d += "/" + dirs[i];
          try {
            FS.mkdir(d, mode);
          } catch (e) {
            if (e.errno != 20) throw e;
          }
        }
      },
      mkdev(path, mode, dev) {
        if (typeof dev == "undefined") {
          dev = mode;
          mode = 438;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },
      symlink(oldpath, newpath) {
        if (!PATH_FS.resolve(oldpath)) {
          throw new FS.ErrnoError(44);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var newname = PATH.basename(newpath);
        var errCode = FS.mayCreate(parent, newname);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },
      rename(old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        var lookup, old_dir, new_dir;
        lookup = FS.lookupPath(old_path, { parent: true });
        old_dir = lookup.node;
        lookup = FS.lookupPath(new_path, { parent: true });
        new_dir = lookup.node;
        if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(75);
        }
        var old_node = FS.lookupNode(old_dir, old_name);
        var relative = PATH_FS.relative(old_path, new_dirname);
        if (relative.charAt(0) !== ".") {
          throw new FS.ErrnoError(28);
        }
        relative = PATH_FS.relative(new_path, old_dirname);
        if (relative.charAt(0) !== ".") {
          throw new FS.ErrnoError(55);
        }
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {}
        if (old_node === new_node) {
          return;
        }
        var isdir = FS.isDir(old_node.mode);
        var errCode = FS.mayDelete(old_dir, old_name, isdir);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        errCode = new_node
          ? FS.mayDelete(new_dir, new_name, isdir)
          : FS.mayCreate(new_dir, new_name);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(63);
        }
        if (
          FS.isMountpoint(old_node) ||
          (new_node && FS.isMountpoint(new_node))
        ) {
          throw new FS.ErrnoError(10);
        }
        if (new_dir !== old_dir) {
          errCode = FS.nodePermissions(old_dir, "w");
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
        }
        FS.hashRemoveNode(old_node);
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
          old_node.parent = new_dir;
        } catch (e) {
          throw e;
        } finally {
          FS.hashAddNode(old_node);
        }
      },
      rmdir(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, true);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },
      readdir(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(54);
        }
        return node.node_ops.readdir(node);
      },
      unlink(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, false);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },
      readlink(path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
          throw new FS.ErrnoError(44);
        }
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(28);
        }
        return PATH_FS.resolve(
          FS.getPath(link.parent),
          link.node_ops.readlink(link)
        );
      },
      stat(path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node) {
          throw new FS.ErrnoError(44);
        }
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(63);
        }
        return node.node_ops.getattr(node);
      },
      lstat(path) {
        return FS.stat(path, true);
      },
      chmod(path, mode, dontFollow) {
        var node;
        if (typeof path == "string") {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(63);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now(),
        });
      },
      lchmod(path, mode) {
        FS.chmod(path, mode, true);
      },
      fchmod(fd, mode) {
        var stream = FS.getStreamChecked(fd);
        FS.chmod(stream.node, mode);
      },
      chown(path, uid, gid, dontFollow) {
        var node;
        if (typeof path == "string") {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(63);
        }
        node.node_ops.setattr(node, { timestamp: Date.now() });
      },
      lchown(path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },
      fchown(fd, uid, gid) {
        var stream = FS.getStreamChecked(fd);
        FS.chown(stream.node, uid, gid);
      },
      truncate(path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(28);
        }
        var node;
        if (typeof path == "string") {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(28);
        }
        var errCode = FS.nodePermissions(node, "w");
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        node.node_ops.setattr(node, { size: len, timestamp: Date.now() });
      },
      ftruncate(fd, len) {
        var stream = FS.getStreamChecked(fd);
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(28);
        }
        FS.truncate(stream.node, len);
      },
      utime(path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, { timestamp: Math.max(atime, mtime) });
      },
      open(path, flags, mode) {
        if (path === "") {
          throw new FS.ErrnoError(44);
        }
        flags = typeof flags == "string" ? FS_modeStringToFlags(flags) : flags;
        if (flags & 64) {
          mode = typeof mode == "undefined" ? 438 : mode;
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path == "object") {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, { follow: !(flags & 131072) });
            node = lookup.node;
          } catch (e) {}
        }
        var created = false;
        if (flags & 64) {
          if (node) {
            if (flags & 128) {
              throw new FS.ErrnoError(20);
            }
          } else {
            node = FS.mknod(path, mode, 0);
            created = true;
          }
        }
        if (!node) {
          throw new FS.ErrnoError(44);
        }
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        if (flags & 65536 && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(54);
        }
        if (!created) {
          var errCode = FS.mayOpen(node, flags);
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
        }
        if (flags & 512 && !created) {
          FS.truncate(node, 0);
        }
        flags &= ~(128 | 512 | 131072);
        var stream = FS.createStream({
          node,
          path: FS.getPath(node),
          flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          ungotten: [],
          error: false,
        });
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module["logReadFiles"] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
          }
        }
        return stream;
      },
      close(stream) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (stream.getdents) stream.getdents = null;
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
        stream.fd = null;
      },
      isClosed(stream) {
        return stream.fd === null;
      },
      llseek(stream, offset, whence) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(70);
        }
        if (whence != 0 && whence != 1 && whence != 2) {
          throw new FS.ErrnoError(28);
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position;
      },
      read(stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(28);
        }
        var seeking = typeof position != "undefined";
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesRead = stream.stream_ops.read(
          stream,
          buffer,
          offset,
          length,
          position
        );
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },
      write(stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(28);
        }
        if (stream.seekable && stream.flags & 1024) {
          FS.llseek(stream, 0, 2);
        }
        var seeking = typeof position != "undefined";
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesWritten = stream.stream_ops.write(
          stream,
          buffer,
          offset,
          length,
          position,
          canOwn
        );
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },
      allocate(stream, offset, length) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(28);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(8);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(43);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(138);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },
      mmap(stream, length, position, prot, flags) {
        if (
          (prot & 2) !== 0 &&
          (flags & 2) === 0 &&
          (stream.flags & 2097155) !== 2
        ) {
          throw new FS.ErrnoError(2);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(2);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(43);
        }
        if (!length) {
          throw new FS.ErrnoError(28);
        }
        return stream.stream_ops.mmap(stream, length, position, prot, flags);
      },
      msync(stream, buffer, offset, length, mmapFlags) {
        if (!stream.stream_ops.msync) {
          return 0;
        }
        return stream.stream_ops.msync(
          stream,
          buffer,
          offset,
          length,
          mmapFlags
        );
      },
      ioctl(stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(59);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },
      readFile(path, opts = {}) {
        opts.flags = opts.flags || 0;
        opts.encoding = opts.encoding || "binary";
        if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
          throw new Error(`Invalid encoding type "${opts.encoding}"`);
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === "utf8") {
          ret = UTF8ArrayToString(buf, 0);
        } else if (opts.encoding === "binary") {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },
      writeFile(path, data, opts = {}) {
        opts.flags = opts.flags || 577;
        var stream = FS.open(path, opts.flags, opts.mode);
        if (typeof data == "string") {
          var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
          var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
          FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn);
        } else if (ArrayBuffer.isView(data)) {
          FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
        } else {
          throw new Error("Unsupported data type");
        }
        FS.close(stream);
      },
      cwd: () => FS.currentPath,
      chdir(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (lookup.node === null) {
          throw new FS.ErrnoError(44);
        }
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(54);
        }
        var errCode = FS.nodePermissions(lookup.node, "x");
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        FS.currentPath = lookup.path;
      },
      createDefaultDirectories() {
        FS.mkdir("/tmp");
        FS.mkdir("/home");
        FS.mkdir("/home/web_user");
      },
      createDefaultDevices() {
        FS.mkdir("/dev");
        FS.registerDevice(FS.makedev(1, 3), {
          read: () => 0,
          write: (stream, buffer, offset, length, pos) => length,
        });
        FS.mkdev("/dev/null", FS.makedev(1, 3));
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev("/dev/tty", FS.makedev(5, 0));
        FS.mkdev("/dev/tty1", FS.makedev(6, 0));
        var randomBuffer = new Uint8Array(1024),
          randomLeft = 0;
        var randomByte = () => {
          if (randomLeft === 0) {
            randomLeft = randomFill(randomBuffer).byteLength;
          }
          return randomBuffer[--randomLeft];
        };
        FS.createDevice("/dev", "random", randomByte);
        FS.createDevice("/dev", "urandom", randomByte);
        FS.mkdir("/dev/shm");
        FS.mkdir("/dev/shm/tmp");
      },
      createSpecialDirectories() {
        FS.mkdir("/proc");
        var proc_self = FS.mkdir("/proc/self");
        FS.mkdir("/proc/self/fd");
        FS.mount(
          {
            mount() {
              var node = FS.createNode(proc_self, "fd", 16384 | 511, 73);
              node.node_ops = {
                lookup(parent, name) {
                  var fd = +name;
                  var stream = FS.getStreamChecked(fd);
                  var ret = {
                    parent: null,
                    mount: { mountpoint: "fake" },
                    node_ops: { readlink: () => stream.path },
                  };
                  ret.parent = ret;
                  return ret;
                },
              };
              return node;
            },
          },
          {},
          "/proc/self/fd"
        );
      },
      createStandardStreams(input, output, error) {
        if (input) {
          FS.createDevice("/dev", "stdin", input);
        } else {
          FS.symlink("/dev/tty", "/dev/stdin");
        }
        if (output) {
          FS.createDevice("/dev", "stdout", null, output);
        } else {
          FS.symlink("/dev/tty", "/dev/stdout");
        }
        if (error) {
          FS.createDevice("/dev", "stderr", null, error);
        } else {
          FS.symlink("/dev/tty1", "/dev/stderr");
        }
        var stdin = FS.open("/dev/stdin", 0);
        var stdout = FS.open("/dev/stdout", 1);
        var stderr = FS.open("/dev/stderr", 1);
      },
      staticInit() {
        [44].forEach((code) => {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = "<generic error, no stack>";
        });
        FS.nameTable = new Array(4096);
        FS.mount(MEMFS, {}, "/");
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
        FS.filesystems = { MEMFS };
      },
      init(input, output, error) {
        FS.initialized = true;
        input ??= Module["stdin"];
        output ??= Module["stdout"];
        error ??= Module["stderr"];
        FS.createStandardStreams(input, output, error);
      },
      quit() {
        FS.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },
      findObject(path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (!ret.exists) {
          return null;
        }
        return ret.object;
      },
      analyzePath(path, dontResolveLastLink) {
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {}
        var ret = {
          isRoot: false,
          exists: false,
          error: 0,
          name: null,
          path: null,
          object: null,
          parentExists: false,
          parentPath: null,
          parentObject: null,
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === "/";
        } catch (e) {
          ret.error = e.errno;
        }
        return ret;
      },
      createPath(parent, path, canRead, canWrite) {
        parent = typeof parent == "string" ? parent : FS.getPath(parent);
        var parts = path.split("/").reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {}
          parent = current;
        }
        return current;
      },
      createFile(parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(
          typeof parent == "string" ? parent : FS.getPath(parent),
          name
        );
        var mode = FS_getMode(canRead, canWrite);
        return FS.create(path, mode);
      },
      createDataFile(parent, name, data, canRead, canWrite, canOwn) {
        var path = name;
        if (parent) {
          parent = typeof parent == "string" ? parent : FS.getPath(parent);
          path = name ? PATH.join2(parent, name) : parent;
        }
        var mode = FS_getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data == "string") {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i)
              arr[i] = data.charCodeAt(i);
            data = arr;
          }
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 577);
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
      },
      createDevice(parent, name, input, output) {
        var path = PATH.join2(
          typeof parent == "string" ? parent : FS.getPath(parent),
          name
        );
        var mode = FS_getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        FS.registerDevice(dev, {
          open(stream) {
            stream.seekable = false;
          },
          close(stream) {
            if (output?.buffer?.length) {
              output(10);
            }
          },
          read(stream, buffer, offset, length, pos) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(6);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset + i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset + i]);
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          },
        });
        return FS.mkdev(path, mode, dev);
      },
      forceLoadFile(obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents)
          return true;
        if (typeof XMLHttpRequest != "undefined") {
          throw new Error(
            "Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread."
          );
        } else {
          try {
            obj.contents = readBinary(obj.url);
            obj.usedBytes = obj.contents.length;
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
        }
      },
      createLazyFile(parent, name, url, canRead, canWrite) {
        class LazyUint8Array {
          constructor() {
            this.lengthKnown = false;
            this.chunks = [];
          }
          get(idx) {
            if (idx > this.length - 1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = (idx / this.chunkSize) | 0;
            return this.getter(chunkNum)[chunkOffset];
          }
          setDataGetter(getter) {
            this.getter = getter;
          }
          cacheLength() {
            var xhr = new XMLHttpRequest();
            xhr.open("HEAD", url, false);
            xhr.send(null);
            if (
              !((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304)
            )
              throw new Error(
                "Couldn't load " + url + ". Status: " + xhr.status
              );
            var datalength = Number(xhr.getResponseHeader("Content-length"));
            var header;
            var hasByteServing =
              (header = xhr.getResponseHeader("Accept-Ranges")) &&
              header === "bytes";
            var usesGzip =
              (header = xhr.getResponseHeader("Content-Encoding")) &&
              header === "gzip";
            var chunkSize = 1024 * 1024;
            if (!hasByteServing) chunkSize = datalength;
            var doXHR = (from, to) => {
              if (from > to)
                throw new Error(
                  "invalid range (" +
                    from +
                    ", " +
                    to +
                    ") or no bytes requested!"
                );
              if (to > datalength - 1)
                throw new Error(
                  "only " + datalength + " bytes available! programmer error!"
                );
              var xhr = new XMLHttpRequest();
              xhr.open("GET", url, false);
              if (datalength !== chunkSize)
                xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
              xhr.responseType = "arraybuffer";
              if (xhr.overrideMimeType) {
                xhr.overrideMimeType("text/plain; charset=x-user-defined");
              }
              xhr.send(null);
              if (
                !((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304)
              )
                throw new Error(
                  "Couldn't load " + url + ". Status: " + xhr.status
                );
              if (xhr.response !== undefined) {
                return new Uint8Array(xhr.response || []);
              }
              return intArrayFromString(xhr.responseText || "", true);
            };
            var lazyArray = this;
            lazyArray.setDataGetter((chunkNum) => {
              var start = chunkNum * chunkSize;
              var end = (chunkNum + 1) * chunkSize - 1;
              end = Math.min(end, datalength - 1);
              if (typeof lazyArray.chunks[chunkNum] == "undefined") {
                lazyArray.chunks[chunkNum] = doXHR(start, end);
              }
              if (typeof lazyArray.chunks[chunkNum] == "undefined")
                throw new Error("doXHR failed!");
              return lazyArray.chunks[chunkNum];
            });
            if (usesGzip || !datalength) {
              chunkSize = datalength = 1;
              datalength = this.getter(0).length;
              chunkSize = datalength;
              out(
                "LazyFiles on gzip forces download of the whole file when length is accessed"
              );
            }
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true;
          }
          get length() {
            if (!this.lengthKnown) {
              this.cacheLength();
            }
            return this._length;
          }
          get chunkSize() {
            if (!this.lengthKnown) {
              this.cacheLength();
            }
            return this._chunkSize;
          }
        }
        if (typeof XMLHttpRequest != "undefined") {
          if (!ENVIRONMENT_IS_WORKER)
            throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
          var lazyArray = new LazyUint8Array();
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        Object.defineProperties(node, {
          usedBytes: {
            get: function () {
              return this.contents.length;
            },
          },
        });
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach((key) => {
          var fn = node.stream_ops[key];
          stream_ops[key] = (...args) => {
            FS.forceLoadFile(node);
            return fn(...args);
          };
        });
        function writeChunks(stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length) return 0;
          var size = Math.min(contents.length - position, length);
          if (contents.slice) {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        }
        stream_ops.read = (stream, buffer, offset, length, position) => {
          FS.forceLoadFile(node);
          return writeChunks(stream, buffer, offset, length, position);
        };
        stream_ops.mmap = (stream, length, position, prot, flags) => {
          FS.forceLoadFile(node);
          var ptr = mmapAlloc(length);
          if (!ptr) {
            throw new FS.ErrnoError(48);
          }
          writeChunks(stream, HEAP8, ptr, length, position);
          return { ptr, allocated: true };
        };
        node.stream_ops = stream_ops;
        return node;
      },
    };
    var UTF8ToString = (ptr, maxBytesToRead) =>
      ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
    var SYSCALLS = {
      DEFAULT_POLLMASK: 5,
      calculateAt(dirfd, path, allowEmpty) {
        if (PATH.isAbs(path)) {
          return path;
        }
        var dir;
        if (dirfd === -100) {
          dir = FS.cwd();
        } else {
          var dirstream = SYSCALLS.getStreamFromFD(dirfd);
          dir = dirstream.path;
        }
        if (path.length == 0) {
          if (!allowEmpty) {
            throw new FS.ErrnoError(44);
          }
          return dir;
        }
        return PATH.join2(dir, path);
      },
      doStat(func, path, buf) {
        var stat = func(path);
        HEAP32[buf >> 2] = stat.dev;
        HEAP32[(buf + 4) >> 2] = stat.mode;
        HEAPU32[(buf + 8) >> 2] = stat.nlink;
        HEAP32[(buf + 12) >> 2] = stat.uid;
        HEAP32[(buf + 16) >> 2] = stat.gid;
        HEAP32[(buf + 20) >> 2] = stat.rdev;
        (tempI64 = [
          stat.size >>> 0,
          ((tempDouble = stat.size),
          +Math.abs(tempDouble) >= 1
            ? tempDouble > 0
              ? +Math.floor(tempDouble / 4294967296) >>> 0
              : ~~+Math.ceil(
                  (tempDouble - +(~~tempDouble >>> 0)) / 4294967296
                ) >>> 0
            : 0),
        ]),
          (HEAP32[(buf + 24) >> 2] = tempI64[0]),
          (HEAP32[(buf + 28) >> 2] = tempI64[1]);
        HEAP32[(buf + 32) >> 2] = 4096;
        HEAP32[(buf + 36) >> 2] = stat.blocks;
        var atime = stat.atime.getTime();
        var mtime = stat.mtime.getTime();
        var ctime = stat.ctime.getTime();
        (tempI64 = [
          Math.floor(atime / 1e3) >>> 0,
          ((tempDouble = Math.floor(atime / 1e3)),
          +Math.abs(tempDouble) >= 1
            ? tempDouble > 0
              ? +Math.floor(tempDouble / 4294967296) >>> 0
              : ~~+Math.ceil(
                  (tempDouble - +(~~tempDouble >>> 0)) / 4294967296
                ) >>> 0
            : 0),
        ]),
          (HEAP32[(buf + 40) >> 2] = tempI64[0]),
          (HEAP32[(buf + 44) >> 2] = tempI64[1]);
        HEAPU32[(buf + 48) >> 2] = (atime % 1e3) * 1e3 * 1e3;
        (tempI64 = [
          Math.floor(mtime / 1e3) >>> 0,
          ((tempDouble = Math.floor(mtime / 1e3)),
          +Math.abs(tempDouble) >= 1
            ? tempDouble > 0
              ? +Math.floor(tempDouble / 4294967296) >>> 0
              : ~~+Math.ceil(
                  (tempDouble - +(~~tempDouble >>> 0)) / 4294967296
                ) >>> 0
            : 0),
        ]),
          (HEAP32[(buf + 56) >> 2] = tempI64[0]),
          (HEAP32[(buf + 60) >> 2] = tempI64[1]);
        HEAPU32[(buf + 64) >> 2] = (mtime % 1e3) * 1e3 * 1e3;
        (tempI64 = [
          Math.floor(ctime / 1e3) >>> 0,
          ((tempDouble = Math.floor(ctime / 1e3)),
          +Math.abs(tempDouble) >= 1
            ? tempDouble > 0
              ? +Math.floor(tempDouble / 4294967296) >>> 0
              : ~~+Math.ceil(
                  (tempDouble - +(~~tempDouble >>> 0)) / 4294967296
                ) >>> 0
            : 0),
        ]),
          (HEAP32[(buf + 72) >> 2] = tempI64[0]),
          (HEAP32[(buf + 76) >> 2] = tempI64[1]);
        HEAPU32[(buf + 80) >> 2] = (ctime % 1e3) * 1e3 * 1e3;
        (tempI64 = [
          stat.ino >>> 0,
          ((tempDouble = stat.ino),
          +Math.abs(tempDouble) >= 1
            ? tempDouble > 0
              ? +Math.floor(tempDouble / 4294967296) >>> 0
              : ~~+Math.ceil(
                  (tempDouble - +(~~tempDouble >>> 0)) / 4294967296
                ) >>> 0
            : 0),
        ]),
          (HEAP32[(buf + 88) >> 2] = tempI64[0]),
          (HEAP32[(buf + 92) >> 2] = tempI64[1]);
        return 0;
      },
      doMsync(addr, stream, len, flags, offset) {
        if (!FS.isFile(stream.node.mode)) {
          throw new FS.ErrnoError(43);
        }
        if (flags & 2) {
          return 0;
        }
        var buffer = HEAPU8.slice(addr, addr + len);
        FS.msync(stream, buffer, offset, len, flags);
      },
      getStreamFromFD(fd) {
        var stream = FS.getStreamChecked(fd);
        return stream;
      },
      varargs: undefined,
      getStr(ptr) {
        var ret = UTF8ToString(ptr);
        return ret;
      },
    };
    function ___syscall_fcntl64(fd, cmd, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        switch (cmd) {
          case 0: {
            var arg = syscallGetVarargI();
            if (arg < 0) {
              return -28;
            }
            while (FS.streams[arg]) {
              arg++;
            }
            var newStream;
            newStream = FS.dupStream(stream, arg);
            return newStream.fd;
          }
          case 1:
          case 2:
            return 0;
          case 3:
            return stream.flags;
          case 4: {
            var arg = syscallGetVarargI();
            stream.flags |= arg;
            return 0;
          }
          case 12: {
            var arg = syscallGetVarargP();
            var offset = 0;
            HEAP16[(arg + offset) >> 1] = 2;
            return 0;
          }
          case 13:
          case 14:
            return 0;
        }
        return -28;
      } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
      }
    }
    function ___syscall_ioctl(fd, op, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        switch (op) {
          case 21509: {
            if (!stream.tty) return -59;
            return 0;
          }
          case 21505: {
            if (!stream.tty) return -59;
            if (stream.tty.ops.ioctl_tcgets) {
              var termios = stream.tty.ops.ioctl_tcgets(stream);
              var argp = syscallGetVarargP();
              HEAP32[argp >> 2] = termios.c_iflag || 0;
              HEAP32[(argp + 4) >> 2] = termios.c_oflag || 0;
              HEAP32[(argp + 8) >> 2] = termios.c_cflag || 0;
              HEAP32[(argp + 12) >> 2] = termios.c_lflag || 0;
              for (var i = 0; i < 32; i++) {
                HEAP8[argp + i + 17] = termios.c_cc[i] || 0;
              }
              return 0;
            }
            return 0;
          }
          case 21510:
          case 21511:
          case 21512: {
            if (!stream.tty) return -59;
            return 0;
          }
          case 21506:
          case 21507:
          case 21508: {
            if (!stream.tty) return -59;
            if (stream.tty.ops.ioctl_tcsets) {
              var argp = syscallGetVarargP();
              var c_iflag = HEAP32[argp >> 2];
              var c_oflag = HEAP32[(argp + 4) >> 2];
              var c_cflag = HEAP32[(argp + 8) >> 2];
              var c_lflag = HEAP32[(argp + 12) >> 2];
              var c_cc = [];
              for (var i = 0; i < 32; i++) {
                c_cc.push(HEAP8[argp + i + 17]);
              }
              return stream.tty.ops.ioctl_tcsets(stream.tty, op, {
                c_iflag,
                c_oflag,
                c_cflag,
                c_lflag,
                c_cc,
              });
            }
            return 0;
          }
          case 21519: {
            if (!stream.tty) return -59;
            var argp = syscallGetVarargP();
            HEAP32[argp >> 2] = 0;
            return 0;
          }
          case 21520: {
            if (!stream.tty) return -59;
            return -28;
          }
          case 21531: {
            var argp = syscallGetVarargP();
            return FS.ioctl(stream, op, argp);
          }
          case 21523: {
            if (!stream.tty) return -59;
            if (stream.tty.ops.ioctl_tiocgwinsz) {
              var winsize = stream.tty.ops.ioctl_tiocgwinsz(stream.tty);
              var argp = syscallGetVarargP();
              HEAP16[argp >> 1] = winsize[0];
              HEAP16[(argp + 2) >> 1] = winsize[1];
            }
            return 0;
          }
          case 21524: {
            if (!stream.tty) return -59;
            return 0;
          }
          case 21515: {
            if (!stream.tty) return -59;
            return 0;
          }
          default:
            return -28;
        }
      } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
      }
    }
    function ___syscall_openat(dirfd, path, flags, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        path = SYSCALLS.getStr(path);
        path = SYSCALLS.calculateAt(dirfd, path);
        var mode = varargs ? syscallGetVarargI() : 0;
        return FS.open(path, flags, mode).fd;
      } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
      }
    }
    var __abort_js = () => {
      abort("");
    };
    var __embind_register_bigint = (
      primitiveType,
      name,
      size,
      minRange,
      maxRange
    ) => {};
    var embind_init_charCodes = () => {
      var codes = new Array(256);
      for (var i = 0; i < 256; ++i) {
        codes[i] = String.fromCharCode(i);
      }
      embind_charCodes = codes;
    };
    var embind_charCodes;
    var readLatin1String = (ptr) => {
      var ret = "";
      var c = ptr;
      while (HEAPU8[c]) {
        ret += embind_charCodes[HEAPU8[c++]];
      }
      return ret;
    };
    var awaitingDependencies = {};
    var registeredTypes = {};
    var typeDependencies = {};
    var BindingError;
    var throwBindingError = (message) => {
      throw new BindingError(message);
    };
    var InternalError;
    var throwInternalError = (message) => {
      throw new InternalError(message);
    };
    var whenDependentTypesAreResolved = (
      myTypes,
      dependentTypes,
      getTypeConverters
    ) => {
      myTypes.forEach((type) => (typeDependencies[type] = dependentTypes));
      function onComplete(typeConverters) {
        var myTypeConverters = getTypeConverters(typeConverters);
        if (myTypeConverters.length !== myTypes.length) {
          throwInternalError("Mismatched type converter count");
        }
        for (var i = 0; i < myTypes.length; ++i) {
          registerType(myTypes[i], myTypeConverters[i]);
        }
      }
      var typeConverters = new Array(dependentTypes.length);
      var unregisteredTypes = [];
      var registered = 0;
      dependentTypes.forEach((dt, i) => {
        if (registeredTypes.hasOwnProperty(dt)) {
          typeConverters[i] = registeredTypes[dt];
        } else {
          unregisteredTypes.push(dt);
          if (!awaitingDependencies.hasOwnProperty(dt)) {
            awaitingDependencies[dt] = [];
          }
          awaitingDependencies[dt].push(() => {
            typeConverters[i] = registeredTypes[dt];
            ++registered;
            if (registered === unregisteredTypes.length) {
              onComplete(typeConverters);
            }
          });
        }
      });
      if (0 === unregisteredTypes.length) {
        onComplete(typeConverters);
      }
    };
    function sharedRegisterType(rawType, registeredInstance, options = {}) {
      var name = registeredInstance.name;
      if (!rawType) {
        throwBindingError(
          `type "${name}" must have a positive integer typeid pointer`
        );
      }
      if (registeredTypes.hasOwnProperty(rawType)) {
        if (options.ignoreDuplicateRegistrations) {
          return;
        } else {
          throwBindingError(`Cannot register type '${name}' twice`);
        }
      }
      registeredTypes[rawType] = registeredInstance;
      delete typeDependencies[rawType];
      if (awaitingDependencies.hasOwnProperty(rawType)) {
        var callbacks = awaitingDependencies[rawType];
        delete awaitingDependencies[rawType];
        callbacks.forEach((cb) => cb());
      }
    }
    function registerType(rawType, registeredInstance, options = {}) {
      return sharedRegisterType(rawType, registeredInstance, options);
    }
    var GenericWireTypeSize = 8;
    var __embind_register_bool = (rawType, name, trueValue, falseValue) => {
      name = readLatin1String(name);
      registerType(rawType, {
        name,
        fromWireType: function (wt) {
          return !!wt;
        },
        toWireType: function (destructors, o) {
          return o ? trueValue : falseValue;
        },
        argPackAdvance: GenericWireTypeSize,
        readValueFromPointer: function (pointer) {
          return this["fromWireType"](HEAPU8[pointer]);
        },
        destructorFunction: null,
      });
    };
    var shallowCopyInternalPointer = (o) => ({
      count: o.count,
      deleteScheduled: o.deleteScheduled,
      preservePointerOnDelete: o.preservePointerOnDelete,
      ptr: o.ptr,
      ptrType: o.ptrType,
      smartPtr: o.smartPtr,
      smartPtrType: o.smartPtrType,
    });
    var throwInstanceAlreadyDeleted = (obj) => {
      function getInstanceTypeName(handle) {
        return handle.$$.ptrType.registeredClass.name;
      }
      throwBindingError(getInstanceTypeName(obj) + " instance already deleted");
    };
    var finalizationRegistry = false;
    var detachFinalizer = (handle) => {};
    var runDestructor = ($$) => {
      if ($$.smartPtr) {
        $$.smartPtrType.rawDestructor($$.smartPtr);
      } else {
        $$.ptrType.registeredClass.rawDestructor($$.ptr);
      }
    };
    var releaseClassHandle = ($$) => {
      $$.count.value -= 1;
      var toDelete = 0 === $$.count.value;
      if (toDelete) {
        runDestructor($$);
      }
    };
    var downcastPointer = (ptr, ptrClass, desiredClass) => {
      if (ptrClass === desiredClass) {
        return ptr;
      }
      if (undefined === desiredClass.baseClass) {
        return null;
      }
      var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
      if (rv === null) {
        return null;
      }
      return desiredClass.downcast(rv);
    };
    var registeredPointers = {};
    var getInheritedInstanceCount = () =>
      Object.keys(registeredInstances).length;
    var getLiveInheritedInstances = () => {
      var rv = [];
      for (var k in registeredInstances) {
        if (registeredInstances.hasOwnProperty(k)) {
          rv.push(registeredInstances[k]);
        }
      }
      return rv;
    };
    var deletionQueue = [];
    var flushPendingDeletes = () => {
      while (deletionQueue.length) {
        var obj = deletionQueue.pop();
        obj.$$.deleteScheduled = false;
        obj["delete"]();
      }
    };
    var delayFunction;
    var setDelayFunction = (fn) => {
      delayFunction = fn;
      if (deletionQueue.length && delayFunction) {
        delayFunction(flushPendingDeletes);
      }
    };
    var init_embind = () => {
      Module["getInheritedInstanceCount"] = getInheritedInstanceCount;
      Module["getLiveInheritedInstances"] = getLiveInheritedInstances;
      Module["flushPendingDeletes"] = flushPendingDeletes;
      Module["setDelayFunction"] = setDelayFunction;
    };
    var registeredInstances = {};
    var getBasestPointer = (class_, ptr) => {
      if (ptr === undefined) {
        throwBindingError("ptr should not be undefined");
      }
      while (class_.baseClass) {
        ptr = class_.upcast(ptr);
        class_ = class_.baseClass;
      }
      return ptr;
    };
    var getInheritedInstance = (class_, ptr) => {
      ptr = getBasestPointer(class_, ptr);
      return registeredInstances[ptr];
    };
    var makeClassHandle = (prototype, record) => {
      if (!record.ptrType || !record.ptr) {
        throwInternalError("makeClassHandle requires ptr and ptrType");
      }
      var hasSmartPtrType = !!record.smartPtrType;
      var hasSmartPtr = !!record.smartPtr;
      if (hasSmartPtrType !== hasSmartPtr) {
        throwInternalError("Both smartPtrType and smartPtr must be specified");
      }
      record.count = { value: 1 };
      return attachFinalizer(
        Object.create(prototype, { $$: { value: record, writable: true } })
      );
    };
    function RegisteredPointer_fromWireType(ptr) {
      var rawPointer = this.getPointee(ptr);
      if (!rawPointer) {
        this.destructor(ptr);
        return null;
      }
      var registeredInstance = getInheritedInstance(
        this.registeredClass,
        rawPointer
      );
      if (undefined !== registeredInstance) {
        if (0 === registeredInstance.$$.count.value) {
          registeredInstance.$$.ptr = rawPointer;
          registeredInstance.$$.smartPtr = ptr;
          return registeredInstance["clone"]();
        } else {
          var rv = registeredInstance["clone"]();
          this.destructor(ptr);
          return rv;
        }
      }
      function makeDefaultHandle() {
        if (this.isSmartPointer) {
          return makeClassHandle(this.registeredClass.instancePrototype, {
            ptrType: this.pointeeType,
            ptr: rawPointer,
            smartPtrType: this,
            smartPtr: ptr,
          });
        } else {
          return makeClassHandle(this.registeredClass.instancePrototype, {
            ptrType: this,
            ptr,
          });
        }
      }
      var actualType = this.registeredClass.getActualType(rawPointer);
      var registeredPointerRecord = registeredPointers[actualType];
      if (!registeredPointerRecord) {
        return makeDefaultHandle.call(this);
      }
      var toType;
      if (this.isConst) {
        toType = registeredPointerRecord.constPointerType;
      } else {
        toType = registeredPointerRecord.pointerType;
      }
      var dp = downcastPointer(
        rawPointer,
        this.registeredClass,
        toType.registeredClass
      );
      if (dp === null) {
        return makeDefaultHandle.call(this);
      }
      if (this.isSmartPointer) {
        return makeClassHandle(toType.registeredClass.instancePrototype, {
          ptrType: toType,
          ptr: dp,
          smartPtrType: this,
          smartPtr: ptr,
        });
      } else {
        return makeClassHandle(toType.registeredClass.instancePrototype, {
          ptrType: toType,
          ptr: dp,
        });
      }
    }
    var attachFinalizer = (handle) => {
      if ("undefined" === typeof FinalizationRegistry) {
        attachFinalizer = (handle) => handle;
        return handle;
      }
      finalizationRegistry = new FinalizationRegistry((info) => {
        releaseClassHandle(info.$$);
      });
      attachFinalizer = (handle) => {
        var $$ = handle.$$;
        var hasSmartPtr = !!$$.smartPtr;
        if (hasSmartPtr) {
          var info = { $$ };
          finalizationRegistry.register(handle, info, handle);
        }
        return handle;
      };
      detachFinalizer = (handle) => finalizationRegistry.unregister(handle);
      return attachFinalizer(handle);
    };
    var init_ClassHandle = () => {
      Object.assign(ClassHandle.prototype, {
        isAliasOf(other) {
          if (!(this instanceof ClassHandle)) {
            return false;
          }
          if (!(other instanceof ClassHandle)) {
            return false;
          }
          var leftClass = this.$$.ptrType.registeredClass;
          var left = this.$$.ptr;
          other.$$ = other.$$;
          var rightClass = other.$$.ptrType.registeredClass;
          var right = other.$$.ptr;
          while (leftClass.baseClass) {
            left = leftClass.upcast(left);
            leftClass = leftClass.baseClass;
          }
          while (rightClass.baseClass) {
            right = rightClass.upcast(right);
            rightClass = rightClass.baseClass;
          }
          return leftClass === rightClass && left === right;
        },
        clone() {
          if (!this.$$.ptr) {
            throwInstanceAlreadyDeleted(this);
          }
          if (this.$$.preservePointerOnDelete) {
            this.$$.count.value += 1;
            return this;
          } else {
            var clone = attachFinalizer(
              Object.create(Object.getPrototypeOf(this), {
                $$: { value: shallowCopyInternalPointer(this.$$) },
              })
            );
            clone.$$.count.value += 1;
            clone.$$.deleteScheduled = false;
            return clone;
          }
        },
        delete() {
          if (!this.$$.ptr) {
            throwInstanceAlreadyDeleted(this);
          }
          if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
            throwBindingError("Object already scheduled for deletion");
          }
          detachFinalizer(this);
          releaseClassHandle(this.$$);
          if (!this.$$.preservePointerOnDelete) {
            this.$$.smartPtr = undefined;
            this.$$.ptr = undefined;
          }
        },
        isDeleted() {
          return !this.$$.ptr;
        },
        deleteLater() {
          if (!this.$$.ptr) {
            throwInstanceAlreadyDeleted(this);
          }
          if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
            throwBindingError("Object already scheduled for deletion");
          }
          deletionQueue.push(this);
          if (deletionQueue.length === 1 && delayFunction) {
            delayFunction(flushPendingDeletes);
          }
          this.$$.deleteScheduled = true;
          return this;
        },
      });
    };
    function ClassHandle() {}
    var createNamedFunction = (name, body) =>
      Object.defineProperty(body, "name", { value: name });
    var ensureOverloadTable = (proto, methodName, humanName) => {
      if (undefined === proto[methodName].overloadTable) {
        var prevFunc = proto[methodName];
        proto[methodName] = function (...args) {
          if (!proto[methodName].overloadTable.hasOwnProperty(args.length)) {
            throwBindingError(
              `Function '${humanName}' called with an invalid number of arguments (${args.length}) - expects one of (${proto[methodName].overloadTable})!`
            );
          }
          return proto[methodName].overloadTable[args.length].apply(this, args);
        };
        proto[methodName].overloadTable = [];
        proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
      }
    };
    var exposePublicSymbol = (name, value, numArguments) => {
      if (Module.hasOwnProperty(name)) {
        if (
          undefined === numArguments ||
          (undefined !== Module[name].overloadTable &&
            undefined !== Module[name].overloadTable[numArguments])
        ) {
          throwBindingError(`Cannot register public name '${name}' twice`);
        }
        ensureOverloadTable(Module, name, name);
        if (Module.hasOwnProperty(numArguments)) {
          throwBindingError(
            `Cannot register multiple overloads of a function with the same number of arguments (${numArguments})!`
          );
        }
        Module[name].overloadTable[numArguments] = value;
      } else {
        Module[name] = value;
        if (undefined !== numArguments) {
          Module[name].numArguments = numArguments;
        }
      }
    };
    var char_0 = 48;
    var char_9 = 57;
    var makeLegalFunctionName = (name) => {
      if (undefined === name) {
        return "_unknown";
      }
      name = name.replace(/[^a-zA-Z0-9_]/g, "$");
      var f = name.charCodeAt(0);
      if (f >= char_0 && f <= char_9) {
        return `_${name}`;
      }
      return name;
    };
    function RegisteredClass(
      name,
      constructor,
      instancePrototype,
      rawDestructor,
      baseClass,
      getActualType,
      upcast,
      downcast
    ) {
      this.name = name;
      this.constructor = constructor;
      this.instancePrototype = instancePrototype;
      this.rawDestructor = rawDestructor;
      this.baseClass = baseClass;
      this.getActualType = getActualType;
      this.upcast = upcast;
      this.downcast = downcast;
      this.pureVirtualFunctions = [];
    }
    var upcastPointer = (ptr, ptrClass, desiredClass) => {
      while (ptrClass !== desiredClass) {
        if (!ptrClass.upcast) {
          throwBindingError(
            `Expected null or instance of ${desiredClass.name}, got an instance of ${ptrClass.name}`
          );
        }
        ptr = ptrClass.upcast(ptr);
        ptrClass = ptrClass.baseClass;
      }
      return ptr;
    };
    function constNoSmartPtrRawPointerToWireType(destructors, handle) {
      if (handle === null) {
        if (this.isReference) {
          throwBindingError(`null is not a valid ${this.name}`);
        }
        return 0;
      }
      if (!handle.$$) {
        throwBindingError(
          `Cannot pass "${embindRepr(handle)}" as a ${this.name}`
        );
      }
      if (!handle.$$.ptr) {
        throwBindingError(
          `Cannot pass deleted object as a pointer of type ${this.name}`
        );
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
      return ptr;
    }
    function genericPointerToWireType(destructors, handle) {
      var ptr;
      if (handle === null) {
        if (this.isReference) {
          throwBindingError(`null is not a valid ${this.name}`);
        }
        if (this.isSmartPointer) {
          ptr = this.rawConstructor();
          if (destructors !== null) {
            destructors.push(this.rawDestructor, ptr);
          }
          return ptr;
        } else {
          return 0;
        }
      }
      if (!handle || !handle.$$) {
        throwBindingError(
          `Cannot pass "${embindRepr(handle)}" as a ${this.name}`
        );
      }
      if (!handle.$$.ptr) {
        throwBindingError(
          `Cannot pass deleted object as a pointer of type ${this.name}`
        );
      }
      if (!this.isConst && handle.$$.ptrType.isConst) {
        throwBindingError(
          `Cannot convert argument of type ${
            handle.$$.smartPtrType
              ? handle.$$.smartPtrType.name
              : handle.$$.ptrType.name
          } to parameter type ${this.name}`
        );
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
      if (this.isSmartPointer) {
        if (undefined === handle.$$.smartPtr) {
          throwBindingError("Passing raw pointer to smart pointer is illegal");
        }
        switch (this.sharingPolicy) {
          case 0:
            if (handle.$$.smartPtrType === this) {
              ptr = handle.$$.smartPtr;
            } else {
              throwBindingError(
                `Cannot convert argument of type ${
                  handle.$$.smartPtrType
                    ? handle.$$.smartPtrType.name
                    : handle.$$.ptrType.name
                } to parameter type ${this.name}`
              );
            }
            break;
          case 1:
            ptr = handle.$$.smartPtr;
            break;
          case 2:
            if (handle.$$.smartPtrType === this) {
              ptr = handle.$$.smartPtr;
            } else {
              var clonedHandle = handle["clone"]();
              ptr = this.rawShare(
                ptr,
                Emval.toHandle(() => clonedHandle["delete"]())
              );
              if (destructors !== null) {
                destructors.push(this.rawDestructor, ptr);
              }
            }
            break;
          default:
            throwBindingError("Unsupporting sharing policy");
        }
      }
      return ptr;
    }
    function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
      if (handle === null) {
        if (this.isReference) {
          throwBindingError(`null is not a valid ${this.name}`);
        }
        return 0;
      }
      if (!handle.$$) {
        throwBindingError(
          `Cannot pass "${embindRepr(handle)}" as a ${this.name}`
        );
      }
      if (!handle.$$.ptr) {
        throwBindingError(
          `Cannot pass deleted object as a pointer of type ${this.name}`
        );
      }
      if (handle.$$.ptrType.isConst) {
        throwBindingError(
          `Cannot convert argument of type ${handle.$$.ptrType.name} to parameter type ${this.name}`
        );
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
      return ptr;
    }
    function readPointer(pointer) {
      return this["fromWireType"](HEAPU32[pointer >> 2]);
    }
    var init_RegisteredPointer = () => {
      Object.assign(RegisteredPointer.prototype, {
        getPointee(ptr) {
          if (this.rawGetPointee) {
            ptr = this.rawGetPointee(ptr);
          }
          return ptr;
        },
        destructor(ptr) {
          this.rawDestructor?.(ptr);
        },
        argPackAdvance: GenericWireTypeSize,
        readValueFromPointer: readPointer,
        fromWireType: RegisteredPointer_fromWireType,
      });
    };
    function RegisteredPointer(
      name,
      registeredClass,
      isReference,
      isConst,
      isSmartPointer,
      pointeeType,
      sharingPolicy,
      rawGetPointee,
      rawConstructor,
      rawShare,
      rawDestructor
    ) {
      this.name = name;
      this.registeredClass = registeredClass;
      this.isReference = isReference;
      this.isConst = isConst;
      this.isSmartPointer = isSmartPointer;
      this.pointeeType = pointeeType;
      this.sharingPolicy = sharingPolicy;
      this.rawGetPointee = rawGetPointee;
      this.rawConstructor = rawConstructor;
      this.rawShare = rawShare;
      this.rawDestructor = rawDestructor;
      if (!isSmartPointer && registeredClass.baseClass === undefined) {
        if (isConst) {
          this["toWireType"] = constNoSmartPtrRawPointerToWireType;
          this.destructorFunction = null;
        } else {
          this["toWireType"] = nonConstNoSmartPtrRawPointerToWireType;
          this.destructorFunction = null;
        }
      } else {
        this["toWireType"] = genericPointerToWireType;
      }
    }
    var replacePublicSymbol = (name, value, numArguments) => {
      if (!Module.hasOwnProperty(name)) {
        throwInternalError("Replacing nonexistent public symbol");
      }
      if (
        undefined !== Module[name].overloadTable &&
        undefined !== numArguments
      ) {
        Module[name].overloadTable[numArguments] = value;
      } else {
        Module[name] = value;
        Module[name].argCount = numArguments;
      }
    };
    var dynCallLegacy = (sig, ptr, args) => {
      sig = sig.replace(/p/g, "i");
      var f = Module["dynCall_" + sig];
      return f(ptr, ...args);
    };
    var wasmTable;
    var dynCall = (sig, ptr, args = []) => {
      var rtn = dynCallLegacy(sig, ptr, args);
      return rtn;
    };
    var getDynCaller =
      (sig, ptr) =>
      (...args) =>
        dynCall(sig, ptr, args);
    var embind__requireFunction = (signature, rawFunction) => {
      signature = readLatin1String(signature);
      function makeDynCaller() {
        return getDynCaller(signature, rawFunction);
      }
      var fp = makeDynCaller();
      if (typeof fp != "function") {
        throwBindingError(
          `unknown function pointer with signature ${signature}: ${rawFunction}`
        );
      }
      return fp;
    };
    var extendError = (baseErrorType, errorName) => {
      var errorClass = createNamedFunction(errorName, function (message) {
        this.name = errorName;
        this.message = message;
        var stack = new Error(message).stack;
        if (stack !== undefined) {
          this.stack =
            this.toString() + "\n" + stack.replace(/^Error(:[^\n]*)?\n/, "");
        }
      });
      errorClass.prototype = Object.create(baseErrorType.prototype);
      errorClass.prototype.constructor = errorClass;
      errorClass.prototype.toString = function () {
        if (this.message === undefined) {
          return this.name;
        } else {
          return `${this.name}: ${this.message}`;
        }
      };
      return errorClass;
    };
    var UnboundTypeError;
    var getTypeName = (type) => {
      var ptr = ___getTypeName(type);
      var rv = readLatin1String(ptr);
      _free(ptr);
      return rv;
    };
    var throwUnboundTypeError = (message, types) => {
      var unboundTypes = [];
      var seen = {};
      function visit(type) {
        if (seen[type]) {
          return;
        }
        if (registeredTypes[type]) {
          return;
        }
        if (typeDependencies[type]) {
          typeDependencies[type].forEach(visit);
          return;
        }
        unboundTypes.push(type);
        seen[type] = true;
      }
      types.forEach(visit);
      throw new UnboundTypeError(
        `${message}: ` + unboundTypes.map(getTypeName).join([", "])
      );
    };
    var __embind_register_class = (
      rawType,
      rawPointerType,
      rawConstPointerType,
      baseClassRawType,
      getActualTypeSignature,
      getActualType,
      upcastSignature,
      upcast,
      downcastSignature,
      downcast,
      name,
      destructorSignature,
      rawDestructor
    ) => {
      name = readLatin1String(name);
      getActualType = embind__requireFunction(
        getActualTypeSignature,
        getActualType
      );
      upcast &&= embind__requireFunction(upcastSignature, upcast);
      downcast &&= embind__requireFunction(downcastSignature, downcast);
      rawDestructor = embind__requireFunction(
        destructorSignature,
        rawDestructor
      );
      var legalFunctionName = makeLegalFunctionName(name);
      exposePublicSymbol(legalFunctionName, function () {
        throwUnboundTypeError(`Cannot construct ${name} due to unbound types`, [
          baseClassRawType,
        ]);
      });
      whenDependentTypesAreResolved(
        [rawType, rawPointerType, rawConstPointerType],
        baseClassRawType ? [baseClassRawType] : [],
        (base) => {
          base = base[0];
          var baseClass;
          var basePrototype;
          if (baseClassRawType) {
            baseClass = base.registeredClass;
            basePrototype = baseClass.instancePrototype;
          } else {
            basePrototype = ClassHandle.prototype;
          }
          var constructor = createNamedFunction(name, function (...args) {
            if (Object.getPrototypeOf(this) !== instancePrototype) {
              throw new BindingError("Use 'new' to construct " + name);
            }
            if (undefined === registeredClass.constructor_body) {
              throw new BindingError(name + " has no accessible constructor");
            }
            var body = registeredClass.constructor_body[args.length];
            if (undefined === body) {
              throw new BindingError(
                `Tried to invoke ctor of ${name} with invalid number of parameters (${
                  args.length
                }) - expected (${Object.keys(
                  registeredClass.constructor_body
                ).toString()}) parameters instead!`
              );
            }
            return body.apply(this, args);
          });
          var instancePrototype = Object.create(basePrototype, {
            constructor: { value: constructor },
          });
          constructor.prototype = instancePrototype;
          var registeredClass = new RegisteredClass(
            name,
            constructor,
            instancePrototype,
            rawDestructor,
            baseClass,
            getActualType,
            upcast,
            downcast
          );
          if (registeredClass.baseClass) {
            registeredClass.baseClass.__derivedClasses ??= [];
            registeredClass.baseClass.__derivedClasses.push(registeredClass);
          }
          var referenceConverter = new RegisteredPointer(
            name,
            registeredClass,
            true,
            false,
            false
          );
          var pointerConverter = new RegisteredPointer(
            name + "*",
            registeredClass,
            false,
            false,
            false
          );
          var constPointerConverter = new RegisteredPointer(
            name + " const*",
            registeredClass,
            false,
            true,
            false
          );
          registeredPointers[rawType] = {
            pointerType: pointerConverter,
            constPointerType: constPointerConverter,
          };
          replacePublicSymbol(legalFunctionName, constructor);
          return [referenceConverter, pointerConverter, constPointerConverter];
        }
      );
    };
    var runDestructors = (destructors) => {
      while (destructors.length) {
        var ptr = destructors.pop();
        var del = destructors.pop();
        del(ptr);
      }
    };
    function usesDestructorStack(argTypes) {
      for (var i = 1; i < argTypes.length; ++i) {
        if (
          argTypes[i] !== null &&
          argTypes[i].destructorFunction === undefined
        ) {
          return true;
        }
      }
      return false;
    }
    function newFunc(constructor, argumentList) {
      if (!(constructor instanceof Function)) {
        throw new TypeError(
          `new_ called with constructor type ${typeof constructor} which is not a function`
        );
      }
      var dummy = createNamedFunction(
        constructor.name || "unknownFunctionName",
        function () {}
      );
      dummy.prototype = constructor.prototype;
      var obj = new dummy();
      var r = constructor.apply(obj, argumentList);
      return r instanceof Object ? r : obj;
    }
    function createJsInvoker(argTypes, isClassMethodFunc, returns, isAsync) {
      var needsDestructorStack = usesDestructorStack(argTypes);
      var argCount = argTypes.length - 2;
      var argsList = [];
      var argsListWired = ["fn"];
      if (isClassMethodFunc) {
        argsListWired.push("thisWired");
      }
      for (var i = 0; i < argCount; ++i) {
        argsList.push(`arg${i}`);
        argsListWired.push(`arg${i}Wired`);
      }
      argsList = argsList.join(",");
      argsListWired = argsListWired.join(",");
      var invokerFnBody = `\n        return function (${argsList}) {\n        if (arguments.length !== ${argCount}) {\n          throwBindingError('function ' + humanName + ' called with ' + arguments.length + ' arguments, expected ${argCount}');\n        }`;
      if (needsDestructorStack) {
        invokerFnBody += "var destructors = [];\n";
      }
      var dtorStack = needsDestructorStack ? "destructors" : "null";
      var args1 = [
        "humanName",
        "throwBindingError",
        "invoker",
        "fn",
        "runDestructors",
        "retType",
        "classParam",
      ];
      if (isClassMethodFunc) {
        invokerFnBody += `var thisWired = classParam['toWireType'](${dtorStack}, this);\n`;
      }
      for (var i = 0; i < argCount; ++i) {
        invokerFnBody += `var arg${i}Wired = argType${i}['toWireType'](${dtorStack}, arg${i});\n`;
        args1.push(`argType${i}`);
      }
      invokerFnBody +=
        (returns || isAsync ? "var rv = " : "") +
        `invoker(${argsListWired});\n`;
      var returnVal = returns ? "rv" : "";
      args1.push("Asyncify");
      invokerFnBody += `function onDone(${returnVal}) {\n`;
      if (needsDestructorStack) {
        invokerFnBody += "runDestructors(destructors);\n";
      } else {
        for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
          var paramName = i === 1 ? "thisWired" : "arg" + (i - 2) + "Wired";
          if (argTypes[i].destructorFunction !== null) {
            invokerFnBody += `${paramName}_dtor(${paramName});\n`;
            args1.push(`${paramName}_dtor`);
          }
        }
      }
      if (returns) {
        invokerFnBody +=
          "var ret = retType['fromWireType'](rv);\n" + "return ret;\n";
      } else {
      }
      invokerFnBody += "}\n";
      invokerFnBody += `return Asyncify.currData ? Asyncify.whenDone().then(onDone) : onDone(${returnVal});\n`;
      invokerFnBody += "}\n";
      return [args1, invokerFnBody];
    }
    var runAndAbortIfError = (func) => {
      try {
        return func();
      } catch (e) {
        abort(e);
      }
    };
    var handleException = (e) => {
      if (e instanceof ExitStatus || e == "unwind") {
        return EXITSTATUS;
      }
      quit_(1, e);
    };
    var runtimeKeepaliveCounter = 0;
    var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;
    var _proc_exit = (code) => {
      EXITSTATUS = code;
      if (!keepRuntimeAlive()) {
        Module["onExit"]?.(code);
        ABORT = true;
      }
      quit_(code, new ExitStatus(code));
    };
    var exitJS = (status, implicit) => {
      EXITSTATUS = status;
      _proc_exit(status);
    };
    var _exit = exitJS;
    var maybeExit = () => {
      if (!keepRuntimeAlive()) {
        try {
          _exit(EXITSTATUS);
        } catch (e) {
          handleException(e);
        }
      }
    };
    var callUserCallback = (func) => {
      if (ABORT) {
        return;
      }
      try {
        func();
        maybeExit();
      } catch (e) {
        handleException(e);
      }
    };
    var runtimeKeepalivePush = () => {
      runtimeKeepaliveCounter += 1;
    };
    var runtimeKeepalivePop = () => {
      runtimeKeepaliveCounter -= 1;
    };
    var Asyncify = {
      instrumentWasmImports(imports) {
        var importPattern = /^(invoke_.*|__asyncjs__.*)$/;
        for (let [x, original] of Object.entries(imports)) {
          if (typeof original == "function") {
            let isAsyncifyImport = original.isAsync || importPattern.test(x);
          }
        }
      },
      instrumentWasmExports(exports) {
        var ret = {};
        for (let [x, original] of Object.entries(exports)) {
          if (typeof original == "function") {
            ret[x] = (...args) => {
              Asyncify.exportCallStack.push(x);
              try {
                return original(...args);
              } finally {
                if (!ABORT) {
                  var y = Asyncify.exportCallStack.pop();
                  Asyncify.maybeStopUnwind();
                }
              }
            };
          } else {
            ret[x] = original;
          }
        }
        return ret;
      },
      State: { Normal: 0, Unwinding: 1, Rewinding: 2, Disabled: 3 },
      state: 0,
      StackSize: 4096,
      currData: null,
      handleSleepReturnValue: 0,
      exportCallStack: [],
      callStackNameToId: {},
      callStackIdToName: {},
      callStackId: 0,
      asyncPromiseHandlers: null,
      sleepCallbacks: [],
      getCallStackId(funcName) {
        var id = Asyncify.callStackNameToId[funcName];
        if (id === undefined) {
          id = Asyncify.callStackId++;
          Asyncify.callStackNameToId[funcName] = id;
          Asyncify.callStackIdToName[id] = funcName;
        }
        return id;
      },
      maybeStopUnwind() {
        if (
          Asyncify.currData &&
          Asyncify.state === Asyncify.State.Unwinding &&
          Asyncify.exportCallStack.length === 0
        ) {
          Asyncify.state = Asyncify.State.Normal;
          runAndAbortIfError(_asyncify_stop_unwind);
          if (typeof Fibers != "undefined") {
            Fibers.trampoline();
          }
        }
      },
      whenDone() {
        return new Promise((resolve, reject) => {
          Asyncify.asyncPromiseHandlers = { resolve, reject };
        });
      },
      allocateData() {
        var ptr = _malloc(12 + Asyncify.StackSize);
        Asyncify.setDataHeader(ptr, ptr + 12, Asyncify.StackSize);
        Asyncify.setDataRewindFunc(ptr);
        return ptr;
      },
      setDataHeader(ptr, stack, stackSize) {
        HEAPU32[ptr >> 2] = stack;
        HEAPU32[(ptr + 4) >> 2] = stack + stackSize;
      },
      setDataRewindFunc(ptr) {
        var bottomOfCallStack = Asyncify.exportCallStack[0];
        var rewindId = Asyncify.getCallStackId(bottomOfCallStack);
        HEAP32[(ptr + 8) >> 2] = rewindId;
      },
      getDataRewindFuncName(ptr) {
        var id = HEAP32[(ptr + 8) >> 2];
        var name = Asyncify.callStackIdToName[id];
        return name;
      },
      getDataRewindFunc(name) {
        var func = wasmExports[name];
        return func;
      },
      doRewind(ptr) {
        var name = Asyncify.getDataRewindFuncName(ptr);
        var func = Asyncify.getDataRewindFunc(name);
        return func();
      },
      handleSleep(startAsync) {
        if (ABORT) return;
        if (Asyncify.state === Asyncify.State.Normal) {
          var reachedCallback = false;
          var reachedAfterCallback = false;
          startAsync((handleSleepReturnValue = 0) => {
            if (ABORT) return;
            Asyncify.handleSleepReturnValue = handleSleepReturnValue;
            reachedCallback = true;
            if (!reachedAfterCallback) {
              return;
            }
            Asyncify.state = Asyncify.State.Rewinding;
            runAndAbortIfError(() => _asyncify_start_rewind(Asyncify.currData));
            if (typeof Browser != "undefined" && Browser.mainLoop.func) {
              Browser.mainLoop.resume();
            }
            var asyncWasmReturnValue,
              isError = false;
            try {
              asyncWasmReturnValue = Asyncify.doRewind(Asyncify.currData);
            } catch (err) {
              asyncWasmReturnValue = err;
              isError = true;
            }
            var handled = false;
            if (!Asyncify.currData) {
              var asyncPromiseHandlers = Asyncify.asyncPromiseHandlers;
              if (asyncPromiseHandlers) {
                Asyncify.asyncPromiseHandlers = null;
                (isError
                  ? asyncPromiseHandlers.reject
                  : asyncPromiseHandlers.resolve)(asyncWasmReturnValue);
                handled = true;
              }
            }
            if (isError && !handled) {
              throw asyncWasmReturnValue;
            }
          });
          reachedAfterCallback = true;
          if (!reachedCallback) {
            Asyncify.state = Asyncify.State.Unwinding;
            Asyncify.currData = Asyncify.allocateData();
            if (typeof Browser != "undefined" && Browser.mainLoop.func) {
              Browser.mainLoop.pause();
            }
            runAndAbortIfError(() => _asyncify_start_unwind(Asyncify.currData));
          }
        } else if (Asyncify.state === Asyncify.State.Rewinding) {
          Asyncify.state = Asyncify.State.Normal;
          runAndAbortIfError(_asyncify_stop_rewind);
          _free(Asyncify.currData);
          Asyncify.currData = null;
          Asyncify.sleepCallbacks.forEach(callUserCallback);
        } else {
          abort(`invalid state: ${Asyncify.state}`);
        }
        return Asyncify.handleSleepReturnValue;
      },
      handleAsync(startAsync) {
        return Asyncify.handleSleep((wakeUp) => {
          startAsync().then(wakeUp);
        });
      },
    };
    function craftInvokerFunction(
      humanName,
      argTypes,
      classType,
      cppInvokerFunc,
      cppTargetFunc,
      isAsync
    ) {
      var argCount = argTypes.length;
      if (argCount < 2) {
        throwBindingError(
          "argTypes array size mismatch! Must at least get return value and 'this' types!"
        );
      }
      var isClassMethodFunc = argTypes[1] !== null && classType !== null;
      var needsDestructorStack = usesDestructorStack(argTypes);
      var returns = argTypes[0].name !== "void";
      var closureArgs = [
        humanName,
        throwBindingError,
        cppInvokerFunc,
        cppTargetFunc,
        runDestructors,
        argTypes[0],
        argTypes[1],
      ];
      for (var i = 0; i < argCount - 2; ++i) {
        closureArgs.push(argTypes[i + 2]);
      }
      closureArgs.push(Asyncify);
      if (!needsDestructorStack) {
        for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
          if (argTypes[i].destructorFunction !== null) {
            closureArgs.push(argTypes[i].destructorFunction);
          }
        }
      }
      let [args, invokerFnBody] = createJsInvoker(
        argTypes,
        isClassMethodFunc,
        returns,
        isAsync
      );
      args.push(invokerFnBody);
      var invokerFn = newFunc(Function, args)(...closureArgs);
      return createNamedFunction(humanName, invokerFn);
    }
    var heap32VectorToArray = (count, firstElement) => {
      var array = [];
      for (var i = 0; i < count; i++) {
        array.push(HEAPU32[(firstElement + i * 4) >> 2]);
      }
      return array;
    };
    var getFunctionName = (signature) => {
      signature = signature.trim();
      const argsIndex = signature.indexOf("(");
      if (argsIndex !== -1) {
        return signature.substr(0, argsIndex);
      } else {
        return signature;
      }
    };
    var __embind_register_class_function = (
      rawClassType,
      methodName,
      argCount,
      rawArgTypesAddr,
      invokerSignature,
      rawInvoker,
      context,
      isPureVirtual,
      isAsync,
      isNonnullReturn
    ) => {
      var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
      methodName = readLatin1String(methodName);
      methodName = getFunctionName(methodName);
      rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
      whenDependentTypesAreResolved([], [rawClassType], (classType) => {
        classType = classType[0];
        var humanName = `${classType.name}.${methodName}`;
        if (methodName.startsWith("@@")) {
          methodName = Symbol[methodName.substring(2)];
        }
        if (isPureVirtual) {
          classType.registeredClass.pureVirtualFunctions.push(methodName);
        }
        function unboundTypesHandler() {
          throwUnboundTypeError(
            `Cannot call ${humanName} due to unbound types`,
            rawArgTypes
          );
        }
        var proto = classType.registeredClass.instancePrototype;
        var method = proto[methodName];
        if (
          undefined === method ||
          (undefined === method.overloadTable &&
            method.className !== classType.name &&
            method.argCount === argCount - 2)
        ) {
          unboundTypesHandler.argCount = argCount - 2;
          unboundTypesHandler.className = classType.name;
          proto[methodName] = unboundTypesHandler;
        } else {
          ensureOverloadTable(proto, methodName, humanName);
          proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler;
        }
        whenDependentTypesAreResolved([], rawArgTypes, (argTypes) => {
          var memberFunction = craftInvokerFunction(
            humanName,
            argTypes,
            classType,
            rawInvoker,
            context,
            isAsync
          );
          if (undefined === proto[methodName].overloadTable) {
            memberFunction.argCount = argCount - 2;
            proto[methodName] = memberFunction;
          } else {
            proto[methodName].overloadTable[argCount - 2] = memberFunction;
          }
          return [];
        });
        return [];
      });
    };
    var __embind_register_constant = (name, type, value) => {
      name = readLatin1String(name);
      whenDependentTypesAreResolved([], [type], (type) => {
        type = type[0];
        Module[name] = type["fromWireType"](value);
        return [];
      });
    };
    var emval_freelist = [];
    var emval_handles = [];
    var __emval_decref = (handle) => {
      if (handle > 9 && 0 === --emval_handles[handle + 1]) {
        emval_handles[handle] = undefined;
        emval_freelist.push(handle);
      }
    };
    var count_emval_handles = () =>
      emval_handles.length / 2 - 5 - emval_freelist.length;
    var init_emval = () => {
      emval_handles.push(0, 1, undefined, 1, null, 1, true, 1, false, 1);
      Module["count_emval_handles"] = count_emval_handles;
    };
    var Emval = {
      toValue: (handle) => {
        if (!handle) {
          throwBindingError("Cannot use deleted val. handle = " + handle);
        }
        return emval_handles[handle];
      },
      toHandle: (value) => {
        switch (value) {
          case undefined:
            return 2;
          case null:
            return 4;
          case true:
            return 6;
          case false:
            return 8;
          default: {
            const handle = emval_freelist.pop() || emval_handles.length;
            emval_handles[handle] = value;
            emval_handles[handle + 1] = 1;
            return handle;
          }
        }
      },
    };
    var EmValType = {
      name: "emscripten::val",
      fromWireType: (handle) => {
        var rv = Emval.toValue(handle);
        __emval_decref(handle);
        return rv;
      },
      toWireType: (destructors, value) => Emval.toHandle(value),
      argPackAdvance: GenericWireTypeSize,
      readValueFromPointer: readPointer,
      destructorFunction: null,
    };
    var __embind_register_emval = (rawType) => registerType(rawType, EmValType);
    var embindRepr = (v) => {
      if (v === null) {
        return "null";
      }
      var t = typeof v;
      if (t === "object" || t === "array" || t === "function") {
        return v.toString();
      } else {
        return "" + v;
      }
    };
    var floatReadValueFromPointer = (name, width) => {
      switch (width) {
        case 4:
          return function (pointer) {
            return this["fromWireType"](HEAPF32[pointer >> 2]);
          };
        case 8:
          return function (pointer) {
            return this["fromWireType"](HEAPF64[pointer >> 3]);
          };
        default:
          throw new TypeError(`invalid float width (${width}): ${name}`);
      }
    };
    var __embind_register_float = (rawType, name, size) => {
      name = readLatin1String(name);
      registerType(rawType, {
        name,
        fromWireType: (value) => value,
        toWireType: (destructors, value) => value,
        argPackAdvance: GenericWireTypeSize,
        readValueFromPointer: floatReadValueFromPointer(name, size),
        destructorFunction: null,
      });
    };
    var __embind_register_function = (
      name,
      argCount,
      rawArgTypesAddr,
      signature,
      rawInvoker,
      fn,
      isAsync,
      isNonnullReturn
    ) => {
      var argTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
      name = readLatin1String(name);
      name = getFunctionName(name);
      rawInvoker = embind__requireFunction(signature, rawInvoker);
      exposePublicSymbol(
        name,
        function () {
          throwUnboundTypeError(
            `Cannot call ${name} due to unbound types`,
            argTypes
          );
        },
        argCount - 1
      );
      whenDependentTypesAreResolved([], argTypes, (argTypes) => {
        var invokerArgsArray = [argTypes[0], null].concat(argTypes.slice(1));
        replacePublicSymbol(
          name,
          craftInvokerFunction(
            name,
            invokerArgsArray,
            null,
            rawInvoker,
            fn,
            isAsync
          ),
          argCount - 1
        );
        return [];
      });
    };
    var integerReadValueFromPointer = (name, width, signed) => {
      switch (width) {
        case 1:
          return signed
            ? (pointer) => HEAP8[pointer]
            : (pointer) => HEAPU8[pointer];
        case 2:
          return signed
            ? (pointer) => HEAP16[pointer >> 1]
            : (pointer) => HEAPU16[pointer >> 1];
        case 4:
          return signed
            ? (pointer) => HEAP32[pointer >> 2]
            : (pointer) => HEAPU32[pointer >> 2];
        default:
          throw new TypeError(`invalid integer width (${width}): ${name}`);
      }
    };
    var __embind_register_integer = (
      primitiveType,
      name,
      size,
      minRange,
      maxRange
    ) => {
      name = readLatin1String(name);
      if (maxRange === -1) {
        maxRange = 4294967295;
      }
      var fromWireType = (value) => value;
      if (minRange === 0) {
        var bitshift = 32 - 8 * size;
        fromWireType = (value) => (value << bitshift) >>> bitshift;
      }
      var isUnsignedType = name.includes("unsigned");
      var checkAssertions = (value, toTypeName) => {};
      var toWireType;
      if (isUnsignedType) {
        toWireType = function (destructors, value) {
          checkAssertions(value, this.name);
          return value >>> 0;
        };
      } else {
        toWireType = function (destructors, value) {
          checkAssertions(value, this.name);
          return value;
        };
      }
      registerType(primitiveType, {
        name,
        fromWireType,
        toWireType,
        argPackAdvance: GenericWireTypeSize,
        readValueFromPointer: integerReadValueFromPointer(
          name,
          size,
          minRange !== 0
        ),
        destructorFunction: null,
      });
    };
    var __embind_register_memory_view = (rawType, dataTypeIndex, name) => {
      var typeMapping = [
        Int8Array,
        Uint8Array,
        Int16Array,
        Uint16Array,
        Int32Array,
        Uint32Array,
        Float32Array,
        Float64Array,
      ];
      var TA = typeMapping[dataTypeIndex];
      function decodeMemoryView(handle) {
        var size = HEAPU32[handle >> 2];
        var data = HEAPU32[(handle + 4) >> 2];
        return new TA(HEAP8.buffer, data, size);
      }
      name = readLatin1String(name);
      registerType(
        rawType,
        {
          name,
          fromWireType: decodeMemoryView,
          argPackAdvance: GenericWireTypeSize,
          readValueFromPointer: decodeMemoryView,
        },
        { ignoreDuplicateRegistrations: true }
      );
    };
    var stringToUTF8 = (str, outPtr, maxBytesToWrite) =>
      stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
    var __embind_register_std_string = (rawType, name) => {
      name = readLatin1String(name);
      var stdStringIsUTF8 = name === "std::string";
      registerType(rawType, {
        name,
        fromWireType(value) {
          var length = HEAPU32[value >> 2];
          var payload = value + 4;
          var str;
          if (stdStringIsUTF8) {
            var decodeStartPtr = payload;
            for (var i = 0; i <= length; ++i) {
              var currentBytePtr = payload + i;
              if (i == length || HEAPU8[currentBytePtr] == 0) {
                var maxRead = currentBytePtr - decodeStartPtr;
                var stringSegment = UTF8ToString(decodeStartPtr, maxRead);
                if (str === undefined) {
                  str = stringSegment;
                } else {
                  str += String.fromCharCode(0);
                  str += stringSegment;
                }
                decodeStartPtr = currentBytePtr + 1;
              }
            }
          } else {
            var a = new Array(length);
            for (var i = 0; i < length; ++i) {
              a[i] = String.fromCharCode(HEAPU8[payload + i]);
            }
            str = a.join("");
          }
          _free(value);
          return str;
        },
        toWireType(destructors, value) {
          if (value instanceof ArrayBuffer) {
            value = new Uint8Array(value);
          }
          var length;
          var valueIsOfTypeString = typeof value == "string";
          if (
            !(
              valueIsOfTypeString ||
              value instanceof Uint8Array ||
              value instanceof Uint8ClampedArray ||
              value instanceof Int8Array
            )
          ) {
            throwBindingError("Cannot pass non-string to std::string");
          }
          if (stdStringIsUTF8 && valueIsOfTypeString) {
            length = lengthBytesUTF8(value);
          } else {
            length = value.length;
          }
          var base = _malloc(4 + length + 1);
          var ptr = base + 4;
          HEAPU32[base >> 2] = length;
          if (stdStringIsUTF8 && valueIsOfTypeString) {
            stringToUTF8(value, ptr, length + 1);
          } else {
            if (valueIsOfTypeString) {
              for (var i = 0; i < length; ++i) {
                var charCode = value.charCodeAt(i);
                if (charCode > 255) {
                  _free(ptr);
                  throwBindingError(
                    "String has UTF-16 code units that do not fit in 8 bits"
                  );
                }
                HEAPU8[ptr + i] = charCode;
              }
            } else {
              for (var i = 0; i < length; ++i) {
                HEAPU8[ptr + i] = value[i];
              }
            }
          }
          if (destructors !== null) {
            destructors.push(_free, base);
          }
          return base;
        },
        argPackAdvance: GenericWireTypeSize,
        readValueFromPointer: readPointer,
        destructorFunction(ptr) {
          _free(ptr);
        },
      });
    };
    var UTF16Decoder =
      typeof TextDecoder != "undefined"
        ? new TextDecoder("utf-16le")
        : undefined;
    var UTF16ToString = (ptr, maxBytesToRead) => {
      var endPtr = ptr;
      var idx = endPtr >> 1;
      var maxIdx = idx + maxBytesToRead / 2;
      while (!(idx >= maxIdx) && HEAPU16[idx]) ++idx;
      endPtr = idx << 1;
      if (endPtr - ptr > 32 && UTF16Decoder)
        return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
      var str = "";
      for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
        var codeUnit = HEAP16[(ptr + i * 2) >> 1];
        if (codeUnit == 0) break;
        str += String.fromCharCode(codeUnit);
      }
      return str;
    };
    var stringToUTF16 = (str, outPtr, maxBytesToWrite) => {
      maxBytesToWrite ??= 2147483647;
      if (maxBytesToWrite < 2) return 0;
      maxBytesToWrite -= 2;
      var startPtr = outPtr;
      var numCharsToWrite =
        maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
      for (var i = 0; i < numCharsToWrite; ++i) {
        var codeUnit = str.charCodeAt(i);
        HEAP16[outPtr >> 1] = codeUnit;
        outPtr += 2;
      }
      HEAP16[outPtr >> 1] = 0;
      return outPtr - startPtr;
    };
    var lengthBytesUTF16 = (str) => str.length * 2;
    var UTF32ToString = (ptr, maxBytesToRead) => {
      var i = 0;
      var str = "";
      while (!(i >= maxBytesToRead / 4)) {
        var utf32 = HEAP32[(ptr + i * 4) >> 2];
        if (utf32 == 0) break;
        ++i;
        if (utf32 >= 65536) {
          var ch = utf32 - 65536;
          str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
        } else {
          str += String.fromCharCode(utf32);
        }
      }
      return str;
    };
    var stringToUTF32 = (str, outPtr, maxBytesToWrite) => {
      maxBytesToWrite ??= 2147483647;
      if (maxBytesToWrite < 4) return 0;
      var startPtr = outPtr;
      var endPtr = startPtr + maxBytesToWrite - 4;
      for (var i = 0; i < str.length; ++i) {
        var codeUnit = str.charCodeAt(i);
        if (codeUnit >= 55296 && codeUnit <= 57343) {
          var trailSurrogate = str.charCodeAt(++i);
          codeUnit =
            (65536 + ((codeUnit & 1023) << 10)) | (trailSurrogate & 1023);
        }
        HEAP32[outPtr >> 2] = codeUnit;
        outPtr += 4;
        if (outPtr + 4 > endPtr) break;
      }
      HEAP32[outPtr >> 2] = 0;
      return outPtr - startPtr;
    };
    var lengthBytesUTF32 = (str) => {
      var len = 0;
      for (var i = 0; i < str.length; ++i) {
        var codeUnit = str.charCodeAt(i);
        if (codeUnit >= 55296 && codeUnit <= 57343) ++i;
        len += 4;
      }
      return len;
    };
    var __embind_register_std_wstring = (rawType, charSize, name) => {
      name = readLatin1String(name);
      var decodeString, encodeString, readCharAt, lengthBytesUTF;
      if (charSize === 2) {
        decodeString = UTF16ToString;
        encodeString = stringToUTF16;
        lengthBytesUTF = lengthBytesUTF16;
        readCharAt = (pointer) => HEAPU16[pointer >> 1];
      } else if (charSize === 4) {
        decodeString = UTF32ToString;
        encodeString = stringToUTF32;
        lengthBytesUTF = lengthBytesUTF32;
        readCharAt = (pointer) => HEAPU32[pointer >> 2];
      }
      registerType(rawType, {
        name,
        fromWireType: (value) => {
          var length = HEAPU32[value >> 2];
          var str;
          var decodeStartPtr = value + 4;
          for (var i = 0; i <= length; ++i) {
            var currentBytePtr = value + 4 + i * charSize;
            if (i == length || readCharAt(currentBytePtr) == 0) {
              var maxReadBytes = currentBytePtr - decodeStartPtr;
              var stringSegment = decodeString(decodeStartPtr, maxReadBytes);
              if (str === undefined) {
                str = stringSegment;
              } else {
                str += String.fromCharCode(0);
                str += stringSegment;
              }
              decodeStartPtr = currentBytePtr + charSize;
            }
          }
          _free(value);
          return str;
        },
        toWireType: (destructors, value) => {
          if (!(typeof value == "string")) {
            throwBindingError(
              `Cannot pass non-string to C++ string type ${name}`
            );
          }
          var length = lengthBytesUTF(value);
          var ptr = _malloc(4 + length + charSize);
          HEAPU32[ptr >> 2] = length / charSize;
          encodeString(value, ptr + 4, length + charSize);
          if (destructors !== null) {
            destructors.push(_free, ptr);
          }
          return ptr;
        },
        argPackAdvance: GenericWireTypeSize,
        readValueFromPointer: readPointer,
        destructorFunction(ptr) {
          _free(ptr);
        },
      });
    };
    var __embind_register_void = (rawType, name) => {
      name = readLatin1String(name);
      registerType(rawType, {
        isVoid: true,
        name,
        argPackAdvance: 0,
        fromWireType: () => undefined,
        toWireType: (destructors, o) => undefined,
      });
    };
    var __emscripten_memcpy_js = (dest, src, num) =>
      HEAPU8.copyWithin(dest, src, src + num);
    var requireRegisteredType = (rawType, humanName) => {
      var impl = registeredTypes[rawType];
      if (undefined === impl) {
        throwBindingError(
          `${humanName} has unknown type ${getTypeName(rawType)}`
        );
      }
      return impl;
    };
    var emval_returnValue = (returnType, destructorsRef, handle) => {
      var destructors = [];
      var result = returnType["toWireType"](destructors, handle);
      if (destructors.length) {
        HEAPU32[destructorsRef >> 2] = Emval.toHandle(destructors);
      }
      return result;
    };
    var __emval_as = (handle, returnType, destructorsRef) => {
      handle = Emval.toValue(handle);
      returnType = requireRegisteredType(returnType, "emval::as");
      return emval_returnValue(returnType, destructorsRef, handle);
    };
    var emval_methodCallers = [];
    var __emval_call = (caller, handle, destructorsRef, args) => {
      caller = emval_methodCallers[caller];
      handle = Emval.toValue(handle);
      return caller(null, handle, destructorsRef, args);
    };
    var emval_addMethodCaller = (caller) => {
      var id = emval_methodCallers.length;
      emval_methodCallers.push(caller);
      return id;
    };
    var emval_lookupTypes = (argCount, argTypes) => {
      var a = new Array(argCount);
      for (var i = 0; i < argCount; ++i) {
        a[i] = requireRegisteredType(
          HEAPU32[(argTypes + i * 4) >> 2],
          "parameter " + i
        );
      }
      return a;
    };
    var reflectConstruct = Reflect.construct;
    var __emval_get_method_caller = (argCount, argTypes, kind) => {
      var types = emval_lookupTypes(argCount, argTypes);
      var retType = types.shift();
      argCount--;
      var functionBody = `return function (obj, func, destructorsRef, args) {\n`;
      var offset = 0;
      var argsList = [];
      if (kind === 0) {
        argsList.push("obj");
      }
      var params = ["retType"];
      var args = [retType];
      for (var i = 0; i < argCount; ++i) {
        argsList.push("arg" + i);
        params.push("argType" + i);
        args.push(types[i]);
        functionBody += `  var arg${i} = argType${i}.readValueFromPointer(args${
          offset ? "+" + offset : ""
        });\n`;
        offset += types[i].argPackAdvance;
      }
      var invoker = kind === 1 ? "new func" : "func.call";
      functionBody += `  var rv = ${invoker}(${argsList.join(", ")});\n`;
      if (!retType.isVoid) {
        params.push("emval_returnValue");
        args.push(emval_returnValue);
        functionBody +=
          "  return emval_returnValue(retType, destructorsRef, rv);\n";
      }
      functionBody += "};\n";
      params.push(functionBody);
      var invokerFunction = newFunc(Function, params)(...args);
      var functionName = `methodCaller<(${types
        .map((t) => t.name)
        .join(", ")}) => ${retType.name}>`;
      return emval_addMethodCaller(
        createNamedFunction(functionName, invokerFunction)
      );
    };
    var emval_symbols = {};
    var getStringOrSymbol = (address) => {
      var symbol = emval_symbols[address];
      if (symbol === undefined) {
        return readLatin1String(address);
      }
      return symbol;
    };
    var __emval_get_module_property = (name) => {
      name = getStringOrSymbol(name);
      return Emval.toHandle(Module[name]);
    };
    var __emval_get_property = (handle, key) => {
      handle = Emval.toValue(handle);
      key = Emval.toValue(key);
      return Emval.toHandle(handle[key]);
    };
    var __emval_incref = (handle) => {
      if (handle > 9) {
        emval_handles[handle + 1] += 1;
      }
    };
    var __emval_new_array = () => Emval.toHandle([]);
    var __emval_new_cstring = (v) => Emval.toHandle(getStringOrSymbol(v));
    var __emval_new_object = () => Emval.toHandle({});
    var __emval_run_destructors = (handle) => {
      var destructors = Emval.toValue(handle);
      runDestructors(destructors);
      __emval_decref(handle);
    };
    var __emval_set_property = (handle, key, value) => {
      handle = Emval.toValue(handle);
      key = Emval.toValue(key);
      value = Emval.toValue(value);
      handle[key] = value;
    };
    var __emval_take_value = (type, arg) => {
      type = requireRegisteredType(type, "_emval_take_value");
      var v = type["readValueFromPointer"](arg);
      return Emval.toHandle(v);
    };
    var __emval_typeof = (handle) => {
      handle = Emval.toValue(handle);
      return Emval.toHandle(typeof handle);
    };
    var readEmAsmArgsArray = [];
    var readEmAsmArgs = (sigPtr, buf) => {
      readEmAsmArgsArray.length = 0;
      var ch;
      while ((ch = HEAPU8[sigPtr++])) {
        var wide = ch != 105;
        wide &= ch != 112;
        buf += wide && buf % 8 ? 4 : 0;
        readEmAsmArgsArray.push(
          ch == 112
            ? HEAPU32[buf >> 2]
            : ch == 105
            ? HEAP32[buf >> 2]
            : HEAPF64[buf >> 3]
        );
        buf += wide ? 8 : 4;
      }
      return readEmAsmArgsArray;
    };
    var runEmAsmFunction = (code, sigPtr, argbuf) => {
      var args = readEmAsmArgs(sigPtr, argbuf);
      return ASM_CONSTS[code](...args);
    };
    var _emscripten_asm_const_int = (code, sigPtr, argbuf) =>
      runEmAsmFunction(code, sigPtr, argbuf);
    var safeSetTimeout = (func, timeout) =>
      setTimeout(() => {
        callUserCallback(func);
      }, timeout);
    var _emscripten_set_main_loop_timing = (mode, value) => {
      Browser.mainLoop.timingMode = mode;
      Browser.mainLoop.timingValue = value;
      if (!Browser.mainLoop.func) {
        return 1;
      }
      if (!Browser.mainLoop.running) {
        Browser.mainLoop.running = true;
      }
      if (mode == 0) {
        Browser.mainLoop.scheduler =
          function Browser_mainLoop_scheduler_setTimeout() {
            var timeUntilNextTick =
              Math.max(
                0,
                Browser.mainLoop.tickStartTime + value - _emscripten_get_now()
              ) | 0;
            setTimeout(Browser.mainLoop.runner, timeUntilNextTick);
          };
        Browser.mainLoop.method = "timeout";
      } else if (mode == 1) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
          Browser.requestAnimationFrame(Browser.mainLoop.runner);
        };
        Browser.mainLoop.method = "rAF";
      } else if (mode == 2) {
        if (typeof Browser.setImmediate == "undefined") {
          if (typeof setImmediate == "undefined") {
            var setImmediates = [];
            var emscriptenMainLoopMessageId = "setimmediate";
            var Browser_setImmediate_messageHandler = (event) => {
              if (
                event.data === emscriptenMainLoopMessageId ||
                event.data.target === emscriptenMainLoopMessageId
              ) {
                event.stopPropagation();
                setImmediates.shift()();
              }
            };
            addEventListener(
              "message",
              Browser_setImmediate_messageHandler,
              true
            );
            Browser.setImmediate = (func) => {
              setImmediates.push(func);
              if (ENVIRONMENT_IS_WORKER) {
                Module["setImmediates"] ??= [];
                Module["setImmediates"].push(func);
                postMessage({ target: emscriptenMainLoopMessageId });
              } else postMessage(emscriptenMainLoopMessageId, "*");
            };
          } else {
            Browser.setImmediate = setImmediate;
          }
        }
        Browser.mainLoop.scheduler =
          function Browser_mainLoop_scheduler_setImmediate() {
            Browser.setImmediate(Browser.mainLoop.runner);
          };
        Browser.mainLoop.method = "immediate";
      }
      return 0;
    };
    var _emscripten_get_now;
    _emscripten_get_now = () => performance.now();
    var setMainLoop = (
      browserIterationFunc,
      fps,
      simulateInfiniteLoop,
      arg,
      noSetTiming
    ) => {
      Browser.mainLoop.func = browserIterationFunc;
      Browser.mainLoop.arg = arg;
      var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
      function checkIsRunning() {
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) {
          maybeExit();
          return false;
        }
        return true;
      }
      Browser.mainLoop.running = false;
      Browser.mainLoop.runner = function Browser_mainLoop_runner() {
        if (ABORT) return;
        if (Browser.mainLoop.queue.length > 0) {
          var start = Date.now();
          var blocker = Browser.mainLoop.queue.shift();
          blocker.func(blocker.arg);
          if (Browser.mainLoop.remainingBlockers) {
            var remaining = Browser.mainLoop.remainingBlockers;
            var next =
              remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);
            if (blocker.counted) {
              Browser.mainLoop.remainingBlockers = next;
            } else {
              next = next + 0.5;
              Browser.mainLoop.remainingBlockers = (8 * remaining + next) / 9;
            }
          }
          Browser.mainLoop.updateStatus();
          if (!checkIsRunning()) return;
          setTimeout(Browser.mainLoop.runner, 0);
          return;
        }
        if (!checkIsRunning()) return;
        Browser.mainLoop.currentFrameNumber =
          (Browser.mainLoop.currentFrameNumber + 1) | 0;
        if (
          Browser.mainLoop.timingMode == 1 &&
          Browser.mainLoop.timingValue > 1 &&
          Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue !=
            0
        ) {
          Browser.mainLoop.scheduler();
          return;
        } else if (Browser.mainLoop.timingMode == 0) {
          Browser.mainLoop.tickStartTime = _emscripten_get_now();
        }
        Browser.mainLoop.runIter(browserIterationFunc);
        if (!checkIsRunning()) return;
        if (typeof SDL == "object") SDL.audio?.queueNewAudioData?.();
        Browser.mainLoop.scheduler();
      };
      if (!noSetTiming) {
        if (fps && fps > 0) {
          _emscripten_set_main_loop_timing(0, 1e3 / fps);
        } else {
          _emscripten_set_main_loop_timing(1, 1);
        }
        Browser.mainLoop.scheduler();
      }
      if (simulateInfiniteLoop) {
        throw "unwind";
      }
    };
    var warnOnce = (text) => {
      warnOnce.shown ||= {};
      if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        if (ENVIRONMENT_IS_NODE) text = "warning: " + text;
        err(text);
      }
    };
    var Browser = {
      mainLoop: {
        running: false,
        scheduler: null,
        method: "",
        currentlyRunningMainloop: 0,
        func: null,
        arg: 0,
        timingMode: 0,
        timingValue: 0,
        currentFrameNumber: 0,
        queue: [],
        pause() {
          Browser.mainLoop.scheduler = null;
          Browser.mainLoop.currentlyRunningMainloop++;
        },
        resume() {
          Browser.mainLoop.currentlyRunningMainloop++;
          var timingMode = Browser.mainLoop.timingMode;
          var timingValue = Browser.mainLoop.timingValue;
          var func = Browser.mainLoop.func;
          Browser.mainLoop.func = null;
          setMainLoop(func, 0, false, Browser.mainLoop.arg, true);
          _emscripten_set_main_loop_timing(timingMode, timingValue);
          Browser.mainLoop.scheduler();
        },
        updateStatus() {
          if (Module["setStatus"]) {
            var message = Module["statusMessage"] || "Please wait...";
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module["setStatus"](
                  `{message} ({expected - remaining}/{expected})`
                );
              } else {
                Module["setStatus"](message);
              }
            } else {
              Module["setStatus"]("");
            }
          }
        },
        runIter(func) {
          if (ABORT) return;
          if (Module["preMainLoop"]) {
            var preRet = Module["preMainLoop"]();
            if (preRet === false) {
              return;
            }
          }
          callUserCallback(func);
          Module["postMainLoop"]?.();
        },
      },
      useWebGL: false,
      isFullscreen: false,
      pointerLock: false,
      moduleContextCreatedCallbacks: [],
      workers: [],
      init() {
        if (Browser.initted) return;
        Browser.initted = true;
        var imagePlugin = {};
        imagePlugin["canHandle"] = function imagePlugin_canHandle(name) {
          return (
            !Module["noImageDecoding"] &&
            /\.(jpg|jpeg|png|bmp|webp)$/i.test(name)
          );
        };
        imagePlugin["handle"] = function imagePlugin_handle(
          byteArray,
          name,
          onload,
          onerror
        ) {
          var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
          if (b.size !== byteArray.length) {
            b = new Blob([new Uint8Array(byteArray).buffer], {
              type: Browser.getMimetype(name),
            });
          }
          var url = URL.createObjectURL(b);
          var img = new Image();
          img.onload = () => {
            var canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            preloadedImages[name] = canvas;
            URL.revokeObjectURL(url);
            onload?.(byteArray);
          };
          img.onerror = (event) => {
            err(`Image ${url} could not be decoded`);
            onerror?.();
          };
          img.src = url;
        };
        preloadPlugins.push(imagePlugin);
        var audioPlugin = {};
        audioPlugin["canHandle"] = function audioPlugin_canHandle(name) {
          return (
            !Module["noAudioDecoding"] &&
            name.substr(-4) in { ".ogg": 1, ".wav": 1, ".mp3": 1 }
          );
        };
        audioPlugin["handle"] = function audioPlugin_handle(
          byteArray,
          name,
          onload,
          onerror
        ) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            preloadedAudios[name] = audio;
            onload?.(byteArray);
          }
          var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
          var url = URL.createObjectURL(b);
          var audio = new Audio();
          audio.addEventListener("canplaythrough", () => finish(audio), false);
          audio.onerror = function audio_onerror(event) {
            if (done) return;
            err(
              `warning: browser could not fully decode audio ${name}, trying slower base64 approach`
            );
            function encode64(data) {
              var BASE =
                "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
              var PAD = "=";
              var ret = "";
              var leftchar = 0;
              var leftbits = 0;
              for (var i = 0; i < data.length; i++) {
                leftchar = (leftchar << 8) | data[i];
                leftbits += 8;
                while (leftbits >= 6) {
                  var curr = (leftchar >> (leftbits - 6)) & 63;
                  leftbits -= 6;
                  ret += BASE[curr];
                }
              }
              if (leftbits == 2) {
                ret += BASE[(leftchar & 3) << 4];
                ret += PAD + PAD;
              } else if (leftbits == 4) {
                ret += BASE[(leftchar & 15) << 2];
                ret += PAD;
              }
              return ret;
            }
            audio.src =
              "data:audio/x-" +
              name.substr(-3) +
              ";base64," +
              encode64(byteArray);
            finish(audio);
          };
          audio.src = url;
          safeSetTimeout(() => {
            finish(audio);
          }, 1e4);
        };
        preloadPlugins.push(audioPlugin);
        function pointerLockChange() {
          Browser.pointerLock =
            document["pointerLockElement"] === Module["canvas"] ||
            document["mozPointerLockElement"] === Module["canvas"] ||
            document["webkitPointerLockElement"] === Module["canvas"] ||
            document["msPointerLockElement"] === Module["canvas"];
        }
        var canvas = Module["canvas"];
        if (canvas) {
          canvas.requestPointerLock =
            canvas["requestPointerLock"] ||
            canvas["mozRequestPointerLock"] ||
            canvas["webkitRequestPointerLock"] ||
            canvas["msRequestPointerLock"] ||
            (() => {});
          canvas.exitPointerLock =
            document["exitPointerLock"] ||
            document["mozExitPointerLock"] ||
            document["webkitExitPointerLock"] ||
            document["msExitPointerLock"] ||
            (() => {});
          canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
          document.addEventListener(
            "pointerlockchange",
            pointerLockChange,
            false
          );
          document.addEventListener(
            "mozpointerlockchange",
            pointerLockChange,
            false
          );
          document.addEventListener(
            "webkitpointerlockchange",
            pointerLockChange,
            false
          );
          document.addEventListener(
            "mspointerlockchange",
            pointerLockChange,
            false
          );
          if (Module["elementPointerLock"]) {
            canvas.addEventListener(
              "click",
              (ev) => {
                if (
                  !Browser.pointerLock &&
                  Module["canvas"].requestPointerLock
                ) {
                  Module["canvas"].requestPointerLock();
                  ev.preventDefault();
                }
              },
              false
            );
          }
        }
      },
      createContext(canvas, useWebGL, setInModule, webGLContextAttributes) {
        if (useWebGL && Module.ctx && canvas == Module.canvas)
          return Module.ctx;
        var ctx;
        var contextHandle;
        if (useWebGL) {
          var contextAttributes = {
            antialias: false,
            alpha: false,
            majorVersion: 1,
          };
          if (webGLContextAttributes) {
            for (var attribute in webGLContextAttributes) {
              contextAttributes[attribute] = webGLContextAttributes[attribute];
            }
          }
          if (typeof GL != "undefined") {
            contextHandle = GL.createContext(canvas, contextAttributes);
            if (contextHandle) {
              ctx = GL.getContext(contextHandle).GLctx;
            }
          }
        } else {
          ctx = canvas.getContext("2d");
        }
        if (!ctx) return null;
        if (setInModule) {
          Module.ctx = ctx;
          if (useWebGL) GL.makeContextCurrent(contextHandle);
          Browser.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach((callback) =>
            callback()
          );
          Browser.init();
        }
        return ctx;
      },
      fullscreenHandlersInstalled: false,
      lockPointer: undefined,
      resizeCanvas: undefined,
      requestFullscreen(lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer == "undefined")
          Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas == "undefined")
          Browser.resizeCanvas = false;
        var canvas = Module["canvas"];
        function fullscreenChange() {
          Browser.isFullscreen = false;
          var canvasContainer = canvas.parentNode;
          if (
            (document["fullscreenElement"] ||
              document["mozFullScreenElement"] ||
              document["msFullscreenElement"] ||
              document["webkitFullscreenElement"] ||
              document["webkitCurrentFullScreenElement"]) === canvasContainer
          ) {
            canvas.exitFullscreen = Browser.exitFullscreen;
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullscreen = true;
            if (Browser.resizeCanvas) {
              Browser.setFullscreenCanvasSize();
            } else {
              Browser.updateCanvasDimensions(canvas);
            }
          } else {
            canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
            canvasContainer.parentNode.removeChild(canvasContainer);
            if (Browser.resizeCanvas) {
              Browser.setWindowedCanvasSize();
            } else {
              Browser.updateCanvasDimensions(canvas);
            }
          }
          Module["onFullScreen"]?.(Browser.isFullscreen);
          Module["onFullscreen"]?.(Browser.isFullscreen);
        }
        if (!Browser.fullscreenHandlersInstalled) {
          Browser.fullscreenHandlersInstalled = true;
          document.addEventListener(
            "fullscreenchange",
            fullscreenChange,
            false
          );
          document.addEventListener(
            "mozfullscreenchange",
            fullscreenChange,
            false
          );
          document.addEventListener(
            "webkitfullscreenchange",
            fullscreenChange,
            false
          );
          document.addEventListener(
            "MSFullscreenChange",
            fullscreenChange,
            false
          );
        }
        var canvasContainer = document.createElement("div");
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
        canvasContainer.requestFullscreen =
          canvasContainer["requestFullscreen"] ||
          canvasContainer["mozRequestFullScreen"] ||
          canvasContainer["msRequestFullscreen"] ||
          (canvasContainer["webkitRequestFullscreen"]
            ? () =>
                canvasContainer["webkitRequestFullscreen"](
                  Element["ALLOW_KEYBOARD_INPUT"]
                )
            : null) ||
          (canvasContainer["webkitRequestFullScreen"]
            ? () =>
                canvasContainer["webkitRequestFullScreen"](
                  Element["ALLOW_KEYBOARD_INPUT"]
                )
            : null);
        canvasContainer.requestFullscreen();
      },
      exitFullscreen() {
        if (!Browser.isFullscreen) {
          return false;
        }
        var CFS =
          document["exitFullscreen"] ||
          document["cancelFullScreen"] ||
          document["mozCancelFullScreen"] ||
          document["msExitFullscreen"] ||
          document["webkitCancelFullScreen"] ||
          (() => {});
        CFS.apply(document, []);
        return true;
      },
      nextRAF: 0,
      fakeRequestAnimationFrame(func) {
        var now = Date.now();
        if (Browser.nextRAF === 0) {
          Browser.nextRAF = now + 1e3 / 60;
        } else {
          while (now + 2 >= Browser.nextRAF) {
            Browser.nextRAF += 1e3 / 60;
          }
        }
        var delay = Math.max(Browser.nextRAF - now, 0);
        setTimeout(func, delay);
      },
      requestAnimationFrame(func) {
        if (typeof requestAnimationFrame == "function") {
          requestAnimationFrame(func);
          return;
        }
        var RAF = Browser.fakeRequestAnimationFrame;
        RAF(func);
      },
      safeSetTimeout(func, timeout) {
        return safeSetTimeout(func, timeout);
      },
      safeRequestAnimationFrame(func) {
        return Browser.requestAnimationFrame(() => {
          callUserCallback(func);
        });
      },
      getMimetype(name) {
        return {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          bmp: "image/bmp",
          ogg: "audio/ogg",
          wav: "audio/wav",
          mp3: "audio/mpeg",
        }[name.substr(name.lastIndexOf(".") + 1)];
      },
      getUserMedia(func) {
        window.getUserMedia ||=
          navigator["getUserMedia"] || navigator["mozGetUserMedia"];
        window.getUserMedia(func);
      },
      getMovementX(event) {
        return (
          event["movementX"] ||
          event["mozMovementX"] ||
          event["webkitMovementX"] ||
          0
        );
      },
      getMovementY(event) {
        return (
          event["movementY"] ||
          event["mozMovementY"] ||
          event["webkitMovementY"] ||
          0
        );
      },
      getMouseWheelDelta(event) {
        var delta = 0;
        switch (event.type) {
          case "DOMMouseScroll":
            delta = event.detail / 3;
            break;
          case "mousewheel":
            delta = event.wheelDelta / 120;
            break;
          case "wheel":
            delta = event.deltaY;
            switch (event.deltaMode) {
              case 0:
                delta /= 100;
                break;
              case 1:
                delta /= 3;
                break;
              case 2:
                delta *= 80;
                break;
              default:
                throw "unrecognized mouse wheel delta mode: " + event.deltaMode;
            }
            break;
          default:
            throw "unrecognized mouse wheel event: " + event.type;
        }
        return delta;
      },
      mouseX: 0,
      mouseY: 0,
      mouseMovementX: 0,
      mouseMovementY: 0,
      touches: {},
      lastTouches: {},
      calculateMouseCoords(pageX, pageY) {
        var rect = Module["canvas"].getBoundingClientRect();
        var cw = Module["canvas"].width;
        var ch = Module["canvas"].height;
        var scrollX =
          typeof window.scrollX != "undefined"
            ? window.scrollX
            : window.pageXOffset;
        var scrollY =
          typeof window.scrollY != "undefined"
            ? window.scrollY
            : window.pageYOffset;
        var adjustedX = pageX - (scrollX + rect.left);
        var adjustedY = pageY - (scrollY + rect.top);
        adjustedX = adjustedX * (cw / rect.width);
        adjustedY = adjustedY * (ch / rect.height);
        return { x: adjustedX, y: adjustedY };
      },
      setMouseCoords(pageX, pageY) {
        const { x, y } = Browser.calculateMouseCoords(pageX, pageY);
        Browser.mouseMovementX = x - Browser.mouseX;
        Browser.mouseMovementY = y - Browser.mouseY;
        Browser.mouseX = x;
        Browser.mouseY = y;
      },
      calculateMouseEvent(event) {
        if (Browser.pointerLock) {
          if (event.type != "mousemove" && "mozMovementX" in event) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          Browser.mouseX += Browser.mouseMovementX;
          Browser.mouseY += Browser.mouseMovementY;
        } else {
          if (
            event.type === "touchstart" ||
            event.type === "touchend" ||
            event.type === "touchmove"
          ) {
            var touch = event.touch;
            if (touch === undefined) {
              return;
            }
            var coords = Browser.calculateMouseCoords(touch.pageX, touch.pageY);
            if (event.type === "touchstart") {
              Browser.lastTouches[touch.identifier] = coords;
              Browser.touches[touch.identifier] = coords;
            } else if (
              event.type === "touchend" ||
              event.type === "touchmove"
            ) {
              var last = Browser.touches[touch.identifier];
              last ||= coords;
              Browser.lastTouches[touch.identifier] = last;
              Browser.touches[touch.identifier] = coords;
            }
            return;
          }
          Browser.setMouseCoords(event.pageX, event.pageY);
        }
      },
      resizeListeners: [],
      updateResizeListeners() {
        var canvas = Module["canvas"];
        Browser.resizeListeners.forEach((listener) =>
          listener(canvas.width, canvas.height)
        );
      },
      setCanvasSize(width, height, noUpdates) {
        var canvas = Module["canvas"];
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates) Browser.updateResizeListeners();
      },
      windowedWidth: 0,
      windowedHeight: 0,
      setFullscreenCanvasSize() {
        if (typeof SDL != "undefined") {
          var flags = HEAPU32[SDL.screen >> 2];
          flags = flags | 8388608;
          HEAP32[SDL.screen >> 2] = flags;
        }
        Browser.updateCanvasDimensions(Module["canvas"]);
        Browser.updateResizeListeners();
      },
      setWindowedCanvasSize() {
        if (typeof SDL != "undefined") {
          var flags = HEAPU32[SDL.screen >> 2];
          flags = flags & ~8388608;
          HEAP32[SDL.screen >> 2] = flags;
        }
        Browser.updateCanvasDimensions(Module["canvas"]);
        Browser.updateResizeListeners();
      },
      updateCanvasDimensions(canvas, wNative, hNative) {
        if (wNative && hNative) {
          canvas.widthNative = wNative;
          canvas.heightNative = hNative;
        } else {
          wNative = canvas.widthNative;
          hNative = canvas.heightNative;
        }
        var w = wNative;
        var h = hNative;
        if (Module["forcedAspectRatio"] && Module["forcedAspectRatio"] > 0) {
          if (w / h < Module["forcedAspectRatio"]) {
            w = Math.round(h * Module["forcedAspectRatio"]);
          } else {
            h = Math.round(w / Module["forcedAspectRatio"]);
          }
        }
        if (
          (document["fullscreenElement"] ||
            document["mozFullScreenElement"] ||
            document["msFullscreenElement"] ||
            document["webkitFullscreenElement"] ||
            document["webkitCurrentFullScreenElement"]) === canvas.parentNode &&
          typeof screen != "undefined"
        ) {
          var factor = Math.min(screen.width / w, screen.height / h);
          w = Math.round(w * factor);
          h = Math.round(h * factor);
        }
        if (Browser.resizeCanvas) {
          if (canvas.width != w) canvas.width = w;
          if (canvas.height != h) canvas.height = h;
          if (typeof canvas.style != "undefined") {
            canvas.style.removeProperty("width");
            canvas.style.removeProperty("height");
          }
        } else {
          if (canvas.width != wNative) canvas.width = wNative;
          if (canvas.height != hNative) canvas.height = hNative;
          if (typeof canvas.style != "undefined") {
            if (w != wNative || h != hNative) {
              canvas.style.setProperty("width", w + "px", "important");
              canvas.style.setProperty("height", h + "px", "important");
            } else {
              canvas.style.removeProperty("width");
              canvas.style.removeProperty("height");
            }
          }
        }
      },
    };
    var _emscripten_async_call = (func, arg, millis) => {
      function wrapper() {
        ((a1) => dynCall_vi(func, a1))(arg);
      }
      if (millis >= 0 || ENVIRONMENT_IS_NODE) {
        safeSetTimeout(wrapper, millis);
      } else {
        Browser.safeRequestAnimationFrame(wrapper);
      }
    };
    var reallyNegative = (x) => x < 0 || (x === 0 && 1 / x === -Infinity);
    var convertI32PairToI53 = (lo, hi) => (lo >>> 0) + hi * 4294967296;
    var convertU32PairToI53 = (lo, hi) => (lo >>> 0) + (hi >>> 0) * 4294967296;
    var reSign = (value, bits) => {
      if (value <= 0) {
        return value;
      }
      var half = bits <= 32 ? Math.abs(1 << (bits - 1)) : Math.pow(2, bits - 1);
      if (value >= half && (bits <= 32 || value > half)) {
        value = -2 * half + value;
      }
      return value;
    };
    var unSign = (value, bits) => {
      if (value >= 0) {
        return value;
      }
      return bits <= 32
        ? 2 * Math.abs(1 << (bits - 1)) + value
        : Math.pow(2, bits) + value;
    };
    var strLen = (ptr) => {
      var end = ptr;
      while (HEAPU8[end]) ++end;
      return end - ptr;
    };
    var formatString = (format, varargs) => {
      var textIndex = format;
      var argIndex = varargs;
      function prepVararg(ptr, type) {
        if (type === "double" || type === "i64") {
          if (ptr & 7) {
            ptr += 4;
          }
        } else {
        }
        return ptr;
      }
      function getNextArg(type) {
        var ret;
        argIndex = prepVararg(argIndex, type);
        if (type === "double") {
          ret = HEAPF64[argIndex >> 3];
          argIndex += 8;
        } else if (type == "i64") {
          ret = [HEAP32[argIndex >> 2], HEAP32[(argIndex + 4) >> 2]];
          argIndex += 8;
        } else {
          type = "i32";
          ret = HEAP32[argIndex >> 2];
          argIndex += 4;
        }
        return ret;
      }
      var ret = [];
      var curr, next, currArg;
      while (1) {
        var startTextIndex = textIndex;
        curr = HEAP8[textIndex];
        if (curr === 0) break;
        next = HEAP8[textIndex + 1];
        if (curr == 37) {
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[textIndex + 1];
          }
          var width = 0;
          if (next == 42) {
            width = getNextArg("i32");
            textIndex++;
            next = HEAP8[textIndex + 1];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[textIndex + 1];
            }
          }
          var precisionSet = false,
            precision = -1;
          if (next == 46) {
            precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[textIndex + 1];
            if (next == 42) {
              precision = getNextArg("i32");
              textIndex++;
            } else {
              while (1) {
                var precisionChr = HEAP8[textIndex + 1];
                if (precisionChr < 48 || precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[textIndex + 1];
          }
          if (precision < 0) {
            precision = 6;
            precisionSet = false;
          }
          var argSize;
          switch (String.fromCharCode(next)) {
            case "h":
              var nextNext = HEAP8[textIndex + 2];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1;
              } else {
                argSize = 2;
              }
              break;
            case "l":
              var nextNext = HEAP8[textIndex + 2];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8;
              } else {
                argSize = 4;
              }
              break;
            case "L":
            case "q":
            case "j":
              argSize = 8;
              break;
            case "z":
            case "t":
            case "I":
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[textIndex + 1];
          switch (String.fromCharCode(next)) {
            case "d":
            case "i":
            case "u":
            case "o":
            case "x":
            case "X":
            case "p": {
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              currArg = getNextArg("i" + argSize * 8);
              var argText;
              if (argSize == 8) {
                currArg =
                  next == 117
                    ? convertU32PairToI53(currArg[0], currArg[1])
                    : convertI32PairToI53(currArg[0], currArg[1]);
              }
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(
                  currArg & limit,
                  argSize * 8
                );
              }
              var currAbsArg = Math.abs(currArg);
              var prefix = "";
              if (next == 100 || next == 105) {
                argText = reSign(currArg, 8 * argSize).toString(10);
              } else if (next == 117) {
                argText = unSign(currArg, 8 * argSize).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? "0" : "") + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = flagAlternative && currArg != 0 ? "0x" : "";
                if (currArg < 0) {
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((15 - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join("");
                  while (argText.length < argSize * 2) argText = "f" + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = "(nil)";
                } else {
                  prefix = "0x";
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = "0" + argText;
                }
              }
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = "+" + prefix;
                } else if (flagPadSign) {
                  prefix = " " + prefix;
                }
              }
              if (argText.charAt(0) == "-") {
                prefix = "-" + prefix;
                argText = argText.substr(1);
              }
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += " ";
                } else {
                  if (flagZeroPad) {
                    argText = "0" + argText;
                  } else {
                    prefix = " " + prefix;
                  }
                }
              }
              argText = prefix + argText;
              argText.split("").forEach((chr) => ret.push(chr.charCodeAt(0)));
              break;
            }
            case "f":
            case "F":
            case "e":
            case "E":
            case "g":
            case "G": {
              currArg = getNextArg("double");
              var argText;
              if (isNaN(currArg)) {
                argText = "nan";
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? "-" : "") + "inf";
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(
                    currArg.toExponential(effectivePrecision).split("e")[1],
                    10
                  );
                  if (precision > exponent && exponent >= -4) {
                    next = (next == 103 ? "f" : "F").charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = (next == 103 ? "e" : "E").charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + "0" + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && reallyNegative(currArg)) {
                    argText = "-" + argText;
                  }
                }
                var parts = argText.split("e");
                if (isGeneral && !flagAlternative) {
                  while (
                    parts[0].length > 1 &&
                    parts[0].includes(".") &&
                    (parts[0].slice(-1) == "0" || parts[0].slice(-1) == ".")
                  ) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  if (flagAlternative && argText.indexOf(".") == -1)
                    parts[0] += ".";
                  while (precision > effectivePrecision++) parts[0] += "0";
                }
                argText = parts[0] + (parts.length > 1 ? "e" + parts[1] : "");
                if (next == 69) argText = argText.toUpperCase();
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = "+" + argText;
                  } else if (flagPadSign) {
                    argText = " " + argText;
                  }
                }
              }
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += " ";
                } else {
                  if (flagZeroPad && (argText[0] == "-" || argText[0] == "+")) {
                    argText = argText[0] + "0" + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? "0" : " ") + argText;
                  }
                }
              }
              if (next < 97) argText = argText.toUpperCase();
              argText.split("").forEach((chr) => ret.push(chr.charCodeAt(0)));
              break;
            }
            case "s": {
              var arg = getNextArg("i8*");
              var argLength = arg ? strLen(arg) : "(null)".length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[arg++]);
                }
              } else {
                ret = ret.concat(
                  intArrayFromString("(null)".substr(0, argLength), true)
                );
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case "c": {
              if (flagLeftAlign) ret.push(getNextArg("i8"));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg("i8"));
              break;
            }
            case "n": {
              var ptr = getNextArg("i32*");
              HEAP32[ptr >> 2] = ret.length;
              break;
            }
            case "%": {
              ret.push(curr);
              break;
            }
            default: {
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[i]);
              }
            }
          }
          textIndex += 2;
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    };
    function jsStackTrace() {
      return new Error().stack.toString();
    }
    function getCallstack(flags) {
      var callstack = jsStackTrace();
      var iThisFunc = callstack.lastIndexOf("_emscripten_log");
      var iThisFunc2 = callstack.lastIndexOf("_emscripten_get_callstack");
      var iNextLine =
        callstack.indexOf("\n", Math.max(iThisFunc, iThisFunc2)) + 1;
      callstack = callstack.slice(iNextLine);
      if (flags & 8 && typeof emscripten_source_map == "undefined") {
        warnOnce(
          'Source map information is not available, emscripten_log with EM_LOG_C_STACK will be ignored. Build with "--pre-js $EMSCRIPTEN/src/emscripten-source-map.min.js" linker flag to add source map loading to code.'
        );
        flags ^= 8;
        flags |= 16;
      }
      var lines = callstack.split("\n");
      callstack = "";
      var newFirefoxRe = new RegExp("\\s*(.*?)@(.*?):([0-9]+):([0-9]+)");
      var firefoxRe = new RegExp("\\s*(.*?)@(.*):(.*)(:(.*))?");
      var chromeRe = new RegExp("\\s*at (.*?) \\((.*):(.*):(.*)\\)");
      for (var l in lines) {
        var line = lines[l];
        var symbolName = "";
        var file = "";
        var lineno = 0;
        var column = 0;
        var parts = chromeRe.exec(line);
        if (parts && parts.length == 5) {
          symbolName = parts[1];
          file = parts[2];
          lineno = parts[3];
          column = parts[4];
        } else {
          parts = newFirefoxRe.exec(line);
          if (!parts) parts = firefoxRe.exec(line);
          if (parts && parts.length >= 4) {
            symbolName = parts[1];
            file = parts[2];
            lineno = parts[3];
            column = parts[4] | 0;
          } else {
            callstack += line + "\n";
            continue;
          }
        }
        var haveSourceMap = false;
        if (flags & 8) {
          var orig = emscripten_source_map.originalPositionFor({
            line: lineno,
            column,
          });
          haveSourceMap = orig?.source;
          if (haveSourceMap) {
            if (flags & 64) {
              orig.source = orig.source.substring(
                orig.source.replace(/\\/g, "/").lastIndexOf("/") + 1
              );
            }
            callstack += `    at ${symbolName} (${orig.source}:${orig.line}:${orig.column})\n`;
          }
        }
        if (flags & 16 || !haveSourceMap) {
          if (flags & 64) {
            file = file.substring(
              file.replace(/\\/g, "/").lastIndexOf("/") + 1
            );
          }
          callstack +=
            (haveSourceMap ? `     = ${symbolName}` : `    at ${symbolName}`) +
            ` (${file}:${lineno}:${column})\n`;
        }
      }
      callstack = callstack.replace(/\s+$/, "");
      return callstack;
    }
    var emscriptenLog = (flags, str) => {
      if (flags & 24) {
        str = str.replace(/\s+$/, "");
        str += (str.length > 0 ? "\n" : "") + getCallstack(flags);
      }
      if (flags & 1) {
        if (flags & 4) {
          console.error(str);
        } else if (flags & 2) {
          console.warn(str);
        } else if (flags & 512) {
          console.info(str);
        } else if (flags & 256) {
          console.debug(str);
        } else {
          console.log(str);
        }
      } else if (flags & 6) {
        err(str);
      } else {
        out(str);
      }
    };
    var _emscripten_log = (flags, format, varargs) => {
      var result = formatString(format, varargs);
      var str = UTF8ArrayToString(result, 0);
      emscriptenLog(flags, str);
    };
    var getHeapMax = () => 2147483648;
    var growMemory = (size) => {
      var b = wasmMemory.buffer;
      var pages = (size - b.byteLength + 65535) / 65536;
      try {
        wasmMemory.grow(pages);
        updateMemoryViews();
        return 1;
      } catch (e) {}
    };
    var _emscripten_resize_heap = (requestedSize) => {
      var oldSize = HEAPU8.length;
      requestedSize >>>= 0;
      var maxHeapSize = getHeapMax();
      if (requestedSize > maxHeapSize) {
        return false;
      }
      for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
        var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown);
        overGrownHeapSize = Math.min(
          overGrownHeapSize,
          requestedSize + 100663296
        );
        var newSize = Math.min(
          maxHeapSize,
          alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536)
        );
        var replacement = growMemory(newSize);
        if (replacement) {
          return true;
        }
      }
      return false;
    };
    function _fd_close(fd) {
      try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        FS.close(stream);
        return 0;
      } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return e.errno;
      }
    }
    var doReadv = (stream, iov, iovcnt, offset) => {
      var ret = 0;
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[iov >> 2];
        var len = HEAPU32[(iov + 4) >> 2];
        iov += 8;
        var curr = FS.read(stream, HEAP8, ptr, len, offset);
        if (curr < 0) return -1;
        ret += curr;
        if (curr < len) break;
        if (typeof offset != "undefined") {
          offset += curr;
        }
      }
      return ret;
    };
    function _fd_read(fd, iov, iovcnt, pnum) {
      try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var num = doReadv(stream, iov, iovcnt);
        HEAPU32[pnum >> 2] = num;
        return 0;
      } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return e.errno;
      }
    }
    var convertI32PairToI53Checked = (lo, hi) =>
      (hi + 2097152) >>> 0 < 4194305 - !!lo
        ? (lo >>> 0) + hi * 4294967296
        : NaN;
    function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
      var offset = convertI32PairToI53Checked(offset_low, offset_high);
      try {
        if (isNaN(offset)) return 61;
        var stream = SYSCALLS.getStreamFromFD(fd);
        FS.llseek(stream, offset, whence);
        (tempI64 = [
          stream.position >>> 0,
          ((tempDouble = stream.position),
          +Math.abs(tempDouble) >= 1
            ? tempDouble > 0
              ? +Math.floor(tempDouble / 4294967296) >>> 0
              : ~~+Math.ceil(
                  (tempDouble - +(~~tempDouble >>> 0)) / 4294967296
                ) >>> 0
            : 0),
        ]),
          (HEAP32[newOffset >> 2] = tempI64[0]),
          (HEAP32[(newOffset + 4) >> 2] = tempI64[1]);
        if (stream.getdents && offset === 0 && whence === 0)
          stream.getdents = null;
        return 0;
      } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return e.errno;
      }
    }
    var doWritev = (stream, iov, iovcnt, offset) => {
      var ret = 0;
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[iov >> 2];
        var len = HEAPU32[(iov + 4) >> 2];
        iov += 8;
        var curr = FS.write(stream, HEAP8, ptr, len, offset);
        if (curr < 0) return -1;
        ret += curr;
        if (curr < len) {
          break;
        }
        if (typeof offset != "undefined") {
          offset += curr;
        }
      }
      return ret;
    };
    function _fd_write(fd, iov, iovcnt, pnum) {
      try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var num = doWritev(stream, iov, iovcnt);
        HEAPU32[pnum >> 2] = num;
        return 0;
      } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return e.errno;
      }
    }
    var getCFunc = (ident) => {
      var func = Module["_" + ident];
      return func;
    };
    var writeArrayToMemory = (array, buffer) => {
      HEAP8.set(array, buffer);
    };
    var stackAlloc = (sz) => __emscripten_stack_alloc(sz);
    var stringToUTF8OnStack = (str) => {
      var size = lengthBytesUTF8(str) + 1;
      var ret = stackAlloc(size);
      stringToUTF8(str, ret, size);
      return ret;
    };
    var ccall = (ident, returnType, argTypes, args, opts) => {
      var toC = {
        string: (str) => {
          var ret = 0;
          if (str !== null && str !== undefined && str !== 0) {
            ret = stringToUTF8OnStack(str);
          }
          return ret;
        },
        array: (arr) => {
          var ret = stackAlloc(arr.length);
          writeArrayToMemory(arr, ret);
          return ret;
        },
      };
      function convertReturnValue(ret) {
        if (returnType === "string") {
          return UTF8ToString(ret);
        }
        if (returnType === "boolean") return Boolean(ret);
        return ret;
      }
      var func = getCFunc(ident);
      var cArgs = [];
      var stack = 0;
      if (args) {
        for (var i = 0; i < args.length; i++) {
          var converter = toC[argTypes[i]];
          if (converter) {
            if (stack === 0) stack = stackSave();
            cArgs[i] = converter(args[i]);
          } else {
            cArgs[i] = args[i];
          }
        }
      }
      var previousAsync = Asyncify.currData;
      var ret = func(...cArgs);
      function onDone(ret) {
        runtimeKeepalivePop();
        if (stack !== 0) stackRestore(stack);
        return convertReturnValue(ret);
      }
      var asyncMode = opts?.async;
      runtimeKeepalivePush();
      if (Asyncify.currData != previousAsync) {
        return Asyncify.whenDone().then(onDone);
      }
      ret = onDone(ret);
      if (asyncMode) return Promise.resolve(ret);
      return ret;
    };
    var cwrap = (ident, returnType, argTypes, opts) => {
      var numericArgs =
        !argTypes ||
        argTypes.every((type) => type === "number" || type === "boolean");
      var numericRet = returnType !== "string";
      if (numericRet && numericArgs && !opts) {
        return getCFunc(ident);
      }
      return (...args) => ccall(ident, returnType, argTypes, args, opts);
    };
    var FS_createPath = FS.createPath;
    var FS_unlink = (path) => FS.unlink(path);
    var FS_createLazyFile = FS.createLazyFile;
    var FS_createDevice = FS.createDevice;
    FS.createPreloadedFile = FS_createPreloadedFile;
    FS.staticInit();
    Module["FS_createPath"] = FS.createPath;
    Module["FS_createDataFile"] = FS.createDataFile;
    Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
    Module["FS_unlink"] = FS.unlink;
    Module["FS_createLazyFile"] = FS.createLazyFile;
    Module["FS_createDevice"] = FS.createDevice;
    embind_init_charCodes();
    BindingError = Module["BindingError"] = class BindingError extends Error {
      constructor(message) {
        super(message);
        this.name = "BindingError";
      }
    };
    InternalError = Module["InternalError"] = class InternalError extends (
      Error
    ) {
      constructor(message) {
        super(message);
        this.name = "InternalError";
      }
    };
    init_ClassHandle();
    init_embind();
    init_RegisteredPointer();
    UnboundTypeError = Module["UnboundTypeError"] = extendError(
      Error,
      "UnboundTypeError"
    );
    init_emval();
    Module["requestFullscreen"] = Browser.requestFullscreen;
    Module["requestAnimationFrame"] = Browser.requestAnimationFrame;
    Module["setCanvasSize"] = Browser.setCanvasSize;
    Module["pauseMainLoop"] = Browser.mainLoop.pause;
    Module["resumeMainLoop"] = Browser.mainLoop.resume;
    Module["getUserMedia"] = Browser.getUserMedia;
    Module["createContext"] = Browser.createContext;
    var preloadedImages = {};
    var preloadedAudios = {};
    var wasmImports = {
      A: ___syscall_fcntl64,
      I: ___syscall_ioctl,
      J: ___syscall_openat,
      L: __abort_js,
      F: __embind_register_bigint,
      N: __embind_register_bool,
      r: __embind_register_class,
      d: __embind_register_class_function,
      c: __embind_register_constant,
      M: __embind_register_emval,
      C: __embind_register_float,
      g: __embind_register_function,
      u: __embind_register_integer,
      q: __embind_register_memory_view,
      B: __embind_register_std_string,
      w: __embind_register_std_wstring,
      O: __embind_register_void,
      K: __emscripten_memcpy_js,
      t: __emval_as,
      o: __emval_call,
      b: __emval_decref,
      n: __emval_get_method_caller,
      m: __emval_get_module_property,
      x: __emval_get_property,
      f: __emval_incref,
      s: __emval_new_array,
      l: __emval_new_cstring,
      e: __emval_new_object,
      k: __emval_run_destructors,
      j: __emval_set_property,
      i: __emval_take_value,
      h: __emval_typeof,
      p: _emscripten_asm_const_int,
      D: _emscripten_async_call,
      v: _emscripten_get_now,
      P: _emscripten_log,
      G: _emscripten_resize_heap,
      y: _fd_close,
      H: _fd_read,
      E: _fd_seek,
      z: _fd_write,
      a: wasmMemory,
    };
    var wasmExports = createWasm();
    var ___wasm_call_ctors = () => (___wasm_call_ctors = wasmExports["Q"])();
    var ___getTypeName = (a0) => (___getTypeName = wasmExports["R"])(a0);
    var _malloc = (a0) => (_malloc = wasmExports["T"])(a0);
    var _free = (a0) => (_free = wasmExports["U"])(a0);
    var _FMOD_JS_MixFunction = (Module["_FMOD_JS_MixFunction"] = (a0) =>
      (_FMOD_JS_MixFunction = Module["_FMOD_JS_MixFunction"] =
        wasmExports["V"])(a0));
    var _FMOD_JS_MixerSlowpathFunction = (Module[
      "_FMOD_JS_MixerSlowpathFunction"
    ] = () =>
      (_FMOD_JS_MixerSlowpathFunction = Module[
        "_FMOD_JS_MixerSlowpathFunction"
      ] =
        wasmExports["W"])());
    var _FMOD_JS_MixerFastpathFunction = (Module[
      "_FMOD_JS_MixerFastpathFunction"
    ] = (a0) =>
      (_FMOD_JS_MixerFastpathFunction = Module[
        "_FMOD_JS_MixerFastpathFunction"
      ] =
        wasmExports["X"])(a0));
    var __emscripten_stack_restore = (a0) =>
      (__emscripten_stack_restore = wasmExports["Y"])(a0);
    var __emscripten_stack_alloc = (a0) =>
      (__emscripten_stack_alloc = wasmExports["Z"])(a0);
    var _emscripten_stack_get_current = () =>
      (_emscripten_stack_get_current = wasmExports["_"])();
    var dynCall_iiiii = (Module["dynCall_iiiii"] = (a0, a1, a2, a3, a4) =>
      (dynCall_iiiii = Module["dynCall_iiiii"] = wasmExports["$"])(
        a0,
        a1,
        a2,
        a3,
        a4
      ));
    var dynCall_ii = (Module["dynCall_ii"] = (a0, a1) =>
      (dynCall_ii = Module["dynCall_ii"] = wasmExports["aa"])(a0, a1));
    var dynCall_vi = (Module["dynCall_vi"] = (a0, a1) =>
      (dynCall_vi = Module["dynCall_vi"] = wasmExports["ba"])(a0, a1));
    var dynCall_iii = (Module["dynCall_iii"] = (a0, a1, a2) =>
      (dynCall_iii = Module["dynCall_iii"] = wasmExports["ca"])(a0, a1, a2));
    var dynCall_iiii = (Module["dynCall_iiii"] = (a0, a1, a2, a3) =>
      (dynCall_iiii = Module["dynCall_iiii"] = wasmExports["da"])(
        a0,
        a1,
        a2,
        a3
      ));
    var dynCall_iiiiii = (Module["dynCall_iiiiii"] = (a0, a1, a2, a3, a4, a5) =>
      (dynCall_iiiiii = Module["dynCall_iiiiii"] = wasmExports["ea"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5
      ));
    var dynCall_iiif = (Module["dynCall_iiif"] = (a0, a1, a2, a3) =>
      (dynCall_iiif = Module["dynCall_iiif"] = wasmExports["fa"])(
        a0,
        a1,
        a2,
        a3
      ));
    var dynCall_vii = (Module["dynCall_vii"] = (a0, a1, a2) =>
      (dynCall_vii = Module["dynCall_vii"] = wasmExports["ga"])(a0, a1, a2));
    var dynCall_v = (Module["dynCall_v"] = (a0) =>
      (dynCall_v = Module["dynCall_v"] = wasmExports["ha"])(a0));
    var dynCall_iiifj = (Module["dynCall_iiifj"] = (a0, a1, a2, a3, a4, a5) =>
      (dynCall_iiifj = Module["dynCall_iiifj"] = wasmExports["ia"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5
      ));
    var dynCall_fii = (Module["dynCall_fii"] = (a0, a1, a2) =>
      (dynCall_fii = Module["dynCall_fii"] = wasmExports["ja"])(a0, a1, a2));
    var dynCall_iif = (Module["dynCall_iif"] = (a0, a1, a2) =>
      (dynCall_iif = Module["dynCall_iif"] = wasmExports["ka"])(a0, a1, a2));
    var dynCall_fiii = (Module["dynCall_fiii"] = (a0, a1, a2, a3) =>
      (dynCall_fiii = Module["dynCall_fiii"] = wasmExports["la"])(
        a0,
        a1,
        a2,
        a3
      ));
    var dynCall_iiiiiii = (Module["dynCall_iiiiiii"] = (
      a0,
      a1,
      a2,
      a3,
      a4,
      a5,
      a6
    ) =>
      (dynCall_iiiiiii = Module["dynCall_iiiiiii"] = wasmExports["ma"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5,
        a6
      ));
    var dynCall_iiji = (Module["dynCall_iiji"] = (a0, a1, a2, a3, a4) =>
      (dynCall_iiji = Module["dynCall_iiji"] = wasmExports["na"])(
        a0,
        a1,
        a2,
        a3,
        a4
      ));
    var dynCall_fi = (Module["dynCall_fi"] = (a0, a1) =>
      (dynCall_fi = Module["dynCall_fi"] = wasmExports["oa"])(a0, a1));
    var dynCall_iij = (Module["dynCall_iij"] = (a0, a1, a2, a3) =>
      (dynCall_iij = Module["dynCall_iij"] = wasmExports["pa"])(
        a0,
        a1,
        a2,
        a3
      ));
    var dynCall_iiiff = (Module["dynCall_iiiff"] = (a0, a1, a2, a3, a4) =>
      (dynCall_iiiff = Module["dynCall_iiiff"] = wasmExports["qa"])(
        a0,
        a1,
        a2,
        a3,
        a4
      ));
    var dynCall_ji = (Module["dynCall_ji"] = (a0, a1) =>
      (dynCall_ji = Module["dynCall_ji"] = wasmExports["ra"])(a0, a1));
    var dynCall_iijjifi = (Module["dynCall_iijjifi"] = (
      a0,
      a1,
      a2,
      a3,
      a4,
      a5,
      a6,
      a7,
      a8
    ) =>
      (dynCall_iijjifi = Module["dynCall_iijjifi"] = wasmExports["sa"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5,
        a6,
        a7,
        a8
      ));
    var dynCall_iijj = (Module["dynCall_iijj"] = (a0, a1, a2, a3, a4, a5) =>
      (dynCall_iijj = Module["dynCall_iijj"] = wasmExports["ta"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5
      ));
    var dynCall_iijjifii = (Module["dynCall_iijjifii"] = (
      a0,
      a1,
      a2,
      a3,
      a4,
      a5,
      a6,
      a7,
      a8,
      a9
    ) =>
      (dynCall_iijjifii = Module["dynCall_iijjifii"] = wasmExports["ua"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5,
        a6,
        a7,
        a8,
        a9
      ));
    var dynCall_iiiiiiii = (Module["dynCall_iiiiiiii"] = (
      a0,
      a1,
      a2,
      a3,
      a4,
      a5,
      a6,
      a7
    ) =>
      (dynCall_iiiiiiii = Module["dynCall_iiiiiiii"] = wasmExports["va"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5,
        a6,
        a7
      ));
    var dynCall_iiff = (Module["dynCall_iiff"] = (a0, a1, a2, a3) =>
      (dynCall_iiff = Module["dynCall_iiff"] = wasmExports["wa"])(
        a0,
        a1,
        a2,
        a3
      ));
    var dynCall_iifi = (Module["dynCall_iifi"] = (a0, a1, a2, a3) =>
      (dynCall_iifi = Module["dynCall_iifi"] = wasmExports["xa"])(
        a0,
        a1,
        a2,
        a3
      ));
    var dynCall_iiffffffff = (Module["dynCall_iiffffffff"] = (
      a0,
      a1,
      a2,
      a3,
      a4,
      a5,
      a6,
      a7,
      a8,
      a9
    ) =>
      (dynCall_iiffffffff = Module["dynCall_iiffffffff"] = wasmExports["ya"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5,
        a6,
        a7,
        a8,
        a9
      ));
    var dynCall_iijji = (Module["dynCall_iijji"] = (
      a0,
      a1,
      a2,
      a3,
      a4,
      a5,
      a6
    ) =>
      (dynCall_iijji = Module["dynCall_iijji"] = wasmExports["za"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5,
        a6
      ));
    var dynCall_iijf = (Module["dynCall_iijf"] = (a0, a1, a2, a3, a4) =>
      (dynCall_iijf = Module["dynCall_iijf"] = wasmExports["Aa"])(
        a0,
        a1,
        a2,
        a3,
        a4
      ));
    var dynCall_iifff = (Module["dynCall_iifff"] = (a0, a1, a2, a3, a4) =>
      (dynCall_iifff = Module["dynCall_iifff"] = wasmExports["Ba"])(
        a0,
        a1,
        a2,
        a3,
        a4
      ));
    var dynCall_iiffi = (Module["dynCall_iiffi"] = (a0, a1, a2, a3, a4) =>
      (dynCall_iiffi = Module["dynCall_iiffi"] = wasmExports["Ca"])(
        a0,
        a1,
        a2,
        a3,
        a4
      ));
    var dynCall_iiiiiiiiii = (Module["dynCall_iiiiiiiiii"] = (
      a0,
      a1,
      a2,
      a3,
      a4,
      a5,
      a6,
      a7,
      a8,
      a9
    ) =>
      (dynCall_iiiiiiiiii = Module["dynCall_iiiiiiiiii"] = wasmExports["Da"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5,
        a6,
        a7,
        a8,
        a9
      ));
    var dynCall_viiiiii = (Module["dynCall_viiiiii"] = (
      a0,
      a1,
      a2,
      a3,
      a4,
      a5,
      a6
    ) =>
      (dynCall_viiiiii = Module["dynCall_viiiiii"] = wasmExports["Ea"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5,
        a6
      ));
    var dynCall_viii = (Module["dynCall_viii"] = (a0, a1, a2, a3) =>
      (dynCall_viii = Module["dynCall_viii"] = wasmExports["Fa"])(
        a0,
        a1,
        a2,
        a3
      ));
    var dynCall_iiiffi = (Module["dynCall_iiiffi"] = (a0, a1, a2, a3, a4, a5) =>
      (dynCall_iiiffi = Module["dynCall_iiiffi"] = wasmExports["Ga"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5
      ));
    var dynCall_iiifffii = (Module["dynCall_iiifffii"] = (
      a0,
      a1,
      a2,
      a3,
      a4,
      a5,
      a6,
      a7
    ) =>
      (dynCall_iiifffii = Module["dynCall_iiifffii"] = wasmExports["Ha"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5,
        a6,
        a7
      ));
    var dynCall_iiiifffffiii = (Module["dynCall_iiiifffffiii"] = (
      a0,
      a1,
      a2,
      a3,
      a4,
      a5,
      a6,
      a7,
      a8,
      a9,
      a10,
      a11
    ) =>
      (dynCall_iiiifffffiii = Module["dynCall_iiiifffffiii"] =
        wasmExports["Ia"])(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11));
    var dynCall_iiiffffii = (Module["dynCall_iiiffffii"] = (
      a0,
      a1,
      a2,
      a3,
      a4,
      a5,
      a6,
      a7,
      a8
    ) =>
      (dynCall_iiiffffii = Module["dynCall_iiiffffii"] = wasmExports["Ja"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5,
        a6,
        a7,
        a8
      ));
    var dynCall_iiifffffii = (Module["dynCall_iiifffffii"] = (
      a0,
      a1,
      a2,
      a3,
      a4,
      a5,
      a6,
      a7,
      a8,
      a9
    ) =>
      (dynCall_iiifffffii = Module["dynCall_iiifffffii"] = wasmExports["Ka"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5,
        a6,
        a7,
        a8,
        a9
      ));
    var dynCall_iiifffi = (Module["dynCall_iiifffi"] = (
      a0,
      a1,
      a2,
      a3,
      a4,
      a5,
      a6
    ) =>
      (dynCall_iiifffi = Module["dynCall_iiifffi"] = wasmExports["La"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5,
        a6
      ));
    var dynCall_viiii = (Module["dynCall_viiii"] = (a0, a1, a2, a3, a4) =>
      (dynCall_viiii = Module["dynCall_viiii"] = wasmExports["Ma"])(
        a0,
        a1,
        a2,
        a3,
        a4
      ));
    var dynCall_viiiiiiffffff = (Module["dynCall_viiiiiiffffff"] = (
      a0,
      a1,
      a2,
      a3,
      a4,
      a5,
      a6,
      a7,
      a8,
      a9,
      a10,
      a11,
      a12
    ) =>
      (dynCall_viiiiiiffffff = Module["dynCall_viiiiiiffffff"] =
        wasmExports["Na"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5,
        a6,
        a7,
        a8,
        a9,
        a10,
        a11,
        a12
      ));
    var dynCall_viiiiiii = (Module["dynCall_viiiiiii"] = (
      a0,
      a1,
      a2,
      a3,
      a4,
      a5,
      a6,
      a7
    ) =>
      (dynCall_viiiiiii = Module["dynCall_viiiiiii"] = wasmExports["Oa"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5,
        a6,
        a7
      ));
    var dynCall_viiiiif = (Module["dynCall_viiiiif"] = (
      a0,
      a1,
      a2,
      a3,
      a4,
      a5,
      a6
    ) =>
      (dynCall_viiiiif = Module["dynCall_viiiiif"] = wasmExports["Pa"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5,
        a6
      ));
    var dynCall_iiiiffi = (Module["dynCall_iiiiffi"] = (
      a0,
      a1,
      a2,
      a3,
      a4,
      a5,
      a6
    ) =>
      (dynCall_iiiiffi = Module["dynCall_iiiiffi"] = wasmExports["Qa"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5,
        a6
      ));
    var dynCall_iiiiiiiiiiiii = (Module["dynCall_iiiiiiiiiiiii"] = (
      a0,
      a1,
      a2,
      a3,
      a4,
      a5,
      a6,
      a7,
      a8,
      a9,
      a10,
      a11,
      a12
    ) =>
      (dynCall_iiiiiiiiiiiii = Module["dynCall_iiiiiiiiiiiii"] =
        wasmExports["Ra"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5,
        a6,
        a7,
        a8,
        a9,
        a10,
        a11,
        a12
      ));
    var dynCall_iiiiiffi = (Module["dynCall_iiiiiffi"] = (
      a0,
      a1,
      a2,
      a3,
      a4,
      a5,
      a6,
      a7
    ) =>
      (dynCall_iiiiiffi = Module["dynCall_iiiiiffi"] = wasmExports["Sa"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5,
        a6,
        a7
      ));
    var dynCall_viiiiiiiifffii = (Module["dynCall_viiiiiiiifffii"] = (
      a0,
      a1,
      a2,
      a3,
      a4,
      a5,
      a6,
      a7,
      a8,
      a9,
      a10,
      a11,
      a12,
      a13
    ) =>
      (dynCall_viiiiiiiifffii = Module["dynCall_viiiiiiiifffii"] =
        wasmExports["Ta"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5,
        a6,
        a7,
        a8,
        a9,
        a10,
        a11,
        a12,
        a13
      ));
    var dynCall_viiiiiiiiiiii = (Module["dynCall_viiiiiiiiiiii"] = (
      a0,
      a1,
      a2,
      a3,
      a4,
      a5,
      a6,
      a7,
      a8,
      a9,
      a10,
      a11,
      a12
    ) =>
      (dynCall_viiiiiiiiiiii = Module["dynCall_viiiiiiiiiiii"] =
        wasmExports["Ua"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5,
        a6,
        a7,
        a8,
        a9,
        a10,
        a11,
        a12
      ));
    var dynCall_viiiii = (Module["dynCall_viiiii"] = (a0, a1, a2, a3, a4, a5) =>
      (dynCall_viiiii = Module["dynCall_viiiii"] = wasmExports["Va"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5
      ));
    var dynCall_viiiiiiiiifff = (Module["dynCall_viiiiiiiiifff"] = (
      a0,
      a1,
      a2,
      a3,
      a4,
      a5,
      a6,
      a7,
      a8,
      a9,
      a10,
      a11,
      a12
    ) =>
      (dynCall_viiiiiiiiifff = Module["dynCall_viiiiiiiiifff"] =
        wasmExports["Wa"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5,
        a6,
        a7,
        a8,
        a9,
        a10,
        a11,
        a12
      ));
    var dynCall_iiiiiiiiiiii = (Module["dynCall_iiiiiiiiiiii"] = (
      a0,
      a1,
      a2,
      a3,
      a4,
      a5,
      a6,
      a7,
      a8,
      a9,
      a10,
      a11
    ) =>
      (dynCall_iiiiiiiiiiii = Module["dynCall_iiiiiiiiiiii"] =
        wasmExports["Xa"])(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11));
    var dynCall_iiiiiiiii = (Module["dynCall_iiiiiiiii"] = (
      a0,
      a1,
      a2,
      a3,
      a4,
      a5,
      a6,
      a7,
      a8
    ) =>
      (dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = wasmExports["Ya"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5,
        a6,
        a7,
        a8
      ));
    var dynCall_fif = (Module["dynCall_fif"] = (a0, a1, a2) =>
      (dynCall_fif = Module["dynCall_fif"] = wasmExports["Za"])(a0, a1, a2));
    var dynCall_iiifi = (Module["dynCall_iiifi"] = (a0, a1, a2, a3, a4) =>
      (dynCall_iiifi = Module["dynCall_iiifi"] = wasmExports["_a"])(
        a0,
        a1,
        a2,
        a3,
        a4
      ));
    var dynCall_iiifff = (Module["dynCall_iiifff"] = (a0, a1, a2, a3, a4, a5) =>
      (dynCall_iiifff = Module["dynCall_iiifff"] = wasmExports["$a"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5
      ));
    var dynCall_iiidii = (Module["dynCall_iiidii"] = (a0, a1, a2, a3, a4, a5) =>
      (dynCall_iiidii = Module["dynCall_iiidii"] = wasmExports["ab"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5
      ));
    var dynCall_iiiidii = (Module["dynCall_iiiidii"] = (
      a0,
      a1,
      a2,
      a3,
      a4,
      a5,
      a6
    ) =>
      (dynCall_iiiidii = Module["dynCall_iiiidii"] = wasmExports["bb"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5,
        a6
      ));
    var dynCall_iiiif = (Module["dynCall_iiiif"] = (a0, a1, a2, a3, a4) =>
      (dynCall_iiiif = Module["dynCall_iiiif"] = wasmExports["cb"])(
        a0,
        a1,
        a2,
        a3,
        a4
      ));
    var dynCall_iiiffffffff = (Module["dynCall_iiiffffffff"] = (
      a0,
      a1,
      a2,
      a3,
      a4,
      a5,
      a6,
      a7,
      a8,
      a9,
      a10
    ) =>
      (dynCall_iiiffffffff = Module["dynCall_iiiffffffff"] = wasmExports["db"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5,
        a6,
        a7,
        a8,
        a9,
        a10
      ));
    var dynCall_iiddi = (Module["dynCall_iiddi"] = (a0, a1, a2, a3, a4) =>
      (dynCall_iiddi = Module["dynCall_iiddi"] = wasmExports["eb"])(
        a0,
        a1,
        a2,
        a3,
        a4
      ));
    var dynCall_iiiddi = (Module["dynCall_iiiddi"] = (a0, a1, a2, a3, a4, a5) =>
      (dynCall_iiiddi = Module["dynCall_iiiddi"] = wasmExports["fb"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5
      ));
    var dynCall_iidf = (Module["dynCall_iidf"] = (a0, a1, a2, a3) =>
      (dynCall_iidf = Module["dynCall_iidf"] = wasmExports["gb"])(
        a0,
        a1,
        a2,
        a3
      ));
    var dynCall_iiidf = (Module["dynCall_iiidf"] = (a0, a1, a2, a3, a4) =>
      (dynCall_iiidf = Module["dynCall_iiidf"] = wasmExports["hb"])(
        a0,
        a1,
        a2,
        a3,
        a4
      ));
    var dynCall_iidd = (Module["dynCall_iidd"] = (a0, a1, a2, a3) =>
      (dynCall_iidd = Module["dynCall_iidd"] = wasmExports["ib"])(
        a0,
        a1,
        a2,
        a3
      ));
    var dynCall_iiidd = (Module["dynCall_iiidd"] = (a0, a1, a2, a3, a4) =>
      (dynCall_iiidd = Module["dynCall_iiidd"] = wasmExports["jb"])(
        a0,
        a1,
        a2,
        a3,
        a4
      ));
    var dynCall_iiiiff = (Module["dynCall_iiiiff"] = (a0, a1, a2, a3, a4, a5) =>
      (dynCall_iiiiff = Module["dynCall_iiiiff"] = wasmExports["kb"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5
      ));
    var dynCall_iiiifi = (Module["dynCall_iiiifi"] = (a0, a1, a2, a3, a4, a5) =>
      (dynCall_iiiifi = Module["dynCall_iiiifi"] = wasmExports["lb"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5
      ));
    var dynCall_jiji = (Module["dynCall_jiji"] = (a0, a1, a2, a3, a4) =>
      (dynCall_jiji = Module["dynCall_jiji"] = wasmExports["mb"])(
        a0,
        a1,
        a2,
        a3,
        a4
      ));
    var dynCall_iidiiii = (Module["dynCall_iidiiii"] = (
      a0,
      a1,
      a2,
      a3,
      a4,
      a5,
      a6
    ) =>
      (dynCall_iidiiii = Module["dynCall_iidiiii"] = wasmExports["nb"])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5,
        a6
      ));
    var _asyncify_start_unwind = (a0) =>
      (_asyncify_start_unwind = wasmExports["ob"])(a0);
    var _asyncify_stop_unwind = () =>
      (_asyncify_stop_unwind = wasmExports["pb"])();
    var _asyncify_start_rewind = (a0) =>
      (_asyncify_start_rewind = wasmExports["qb"])(a0);
    var _asyncify_stop_rewind = () =>
      (_asyncify_stop_rewind = wasmExports["rb"])();
    Module["addRunDependency"] = addRunDependency;
    Module["removeRunDependency"] = removeRunDependency;
    Module["cwrap"] = cwrap;
    Module["setValue"] = setValue;
    Module["getValue"] = getValue;
    Module["FS_createPreloadedFile"] = FS_createPreloadedFile;
    Module["FS_unlink"] = FS_unlink;
    Module["FS_createPath"] = FS_createPath;
    Module["FS_createDevice"] = FS_createDevice;
    Module["FS_createDataFile"] = FS_createDataFile;
    Module["FS_createLazyFile"] = FS_createLazyFile;
    var calledRun;
    dependenciesFulfilled = function runCaller() {
      if (!calledRun) run();
      if (!calledRun) dependenciesFulfilled = runCaller;
    };
    function run() {
      if (runDependencies > 0) {
        return;
      }
      preRun();
      if (runDependencies > 0) {
        return;
      }
      function doRun() {
        if (calledRun) return;
        calledRun = true;
        Module["calledRun"] = true;
        if (ABORT) return;
        initRuntime();
        readyPromiseResolve(Module);
        Module["onRuntimeInitialized"]?.();
        postRun();
      }
      if (Module["setStatus"]) {
        Module["setStatus"]("Running...");
        setTimeout(() => {
          setTimeout(() => Module["setStatus"](""), 1);
          doRun();
        }, 1);
      } else {
        doRun();
      }
    }
    if (Module["preInit"]) {
      if (typeof Module["preInit"] == "function")
        Module["preInit"] = [Module["preInit"]];
      while (Module["preInit"].length > 0) {
        Module["preInit"].pop()();
      }
    }
    run();
    moduleRtn = readyPromise;

    return moduleRtn;
  };
})();
if (typeof exports === "object" && typeof module === "object")
  module.exports = FMODModule;
else if (typeof define === "function" && define["amd"])
  define([], () => FMODModule);
