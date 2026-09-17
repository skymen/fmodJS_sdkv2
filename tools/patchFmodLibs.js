// Copies the FMOD Studio HTML5 libraries from an FMOD SDK into src/files and
// applies the local fixes we need on top of FMOD's Emscripten glue.
//
// Usage: node tools/patchFmodLibs.js <path to fmodstudioapiXXXXXhtml5/api/studio/lib/wasm>
//
// Variants shipped: fmodstudio (release), fmodstudioL (release + logging).
// Pass --threaded to also produce fmodstudioP / fmodstudioPL (pthread builds);
// they are not used by the addon today (the mixer still runs on the main
// thread in those builds, so they don't help with stutter) but the patches
// apply to them the same way.
//
// Fixes applied:
//  1. Node environment guard. NW.js-style hosts expose `process.versions.node`
//     from a browser page, so Emscripten takes the Node code path (require("fs"),
//     __dirname, worker_threads in the P builds) and crashes. If __dirname is not
//     defined we are not really in Node.
//  2. (Logging builds only) Drop the "cannot enter/leave NULL critical section"
//     warnings. The non-threaded build has no mutexes, so FMOD prints one of
//     these on every lock and buries everything else in the console.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "src", "files");

const sdkDir = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!sdkDir || !fs.existsSync(sdkDir)) {
  console.error(
    "Usage: node tools/patchFmodLibs.js <fmod sdk>/api/studio/lib/wasm"
  );
  process.exit(1);
}

const VARIANTS = [
  { name: "fmodstudio", logging: false },
  { name: "fmodstudioL", logging: true },
];
if (process.argv.includes("--threaded"))
  VARIANTS.push(
    { name: "fmodstudioP", logging: false },
    { name: "fmodstudioPL", logging: true }
  );

const NODE_DETECT =
  'var ENVIRONMENT_IS_NODE=typeof process=="object"&&typeof process.versions=="object"&&typeof process.versions.node=="string";';
const NODE_DETECT_PATCHED =
  NODE_DETECT +
  "if(ENVIRONMENT_IS_NODE){try{if(__dirname===undefined)ENVIRONMENT_IS_NODE=false}catch(e){ENVIRONMENT_IS_NODE=false}}";

const LOG_FN =
  "var _emscripten_log=(flags,format,varargs)=>{var result=formatString(format,varargs);var str=UTF8ArrayToString(result,0);emscriptenLog(flags,str)}";
const LOG_FN_PATCHED =
  "var _emscripten_log=(flags,format,varargs)=>{var result=formatString(format,varargs);var str=UTF8ArrayToString(result,0);" +
  'if((str.includes("FMOD_OS_CriticalSection_Enter")||str.includes("FMOD_OS_CriticalSection_Leave"))&&(str.includes("cannot enter NULL critical section")||str.includes("cannot leave NULL critical section")))return;' +
  "emscriptenLog(flags,str)}";

function replaceOnce(src, from, to, label, file) {
  const first = src.indexOf(from);
  if (first === -1) throw new Error(`${file}: anchor not found for "${label}"`);
  if (src.indexOf(from, first + 1) !== -1)
    throw new Error(`${file}: anchor for "${label}" is not unique`);
  return src.slice(0, first) + to + src.slice(first + from.length);
}

for (const { name, logging } of VARIANTS) {
  const jsFile = `${name}.js`;
  const wasmFile = `${name}.wasm`;
  let js = fs.readFileSync(path.join(sdkDir, jsFile), "utf8");

  js = replaceOnce(js, NODE_DETECT, NODE_DETECT_PATCHED, "node guard", jsFile);
  if (logging)
    js = replaceOnce(js, LOG_FN, LOG_FN_PATCHED, "log filter", jsFile);

  fs.writeFileSync(path.join(outDir, jsFile), js);
  fs.copyFileSync(path.join(sdkDir, wasmFile), path.join(outDir, wasmFile));
  console.log(`patched ${jsFile} (+${wasmFile})`);
}
