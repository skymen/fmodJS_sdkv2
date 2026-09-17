<img src="./examples/cover.webp" width="150" /><br>
# (FMOD) JS API
<i>JS Implementation of FMOD for Construct 3</i> <br>
### Version 2.2.0.0

[<img src="https://placehold.co/200x50/4493f8/FFF?text=Download&font=montserrat" width="200"/>](https://github.com/skymen/fmodJS_sdkv2/releases/download/skymen_fmod_js-2.2.0.0.c3addon/skymen_fmod_js-2.2.0.0.c3addon)
<br>
<sub> [See all releases](https://github.com/skymen/fmodJS_sdkv2/releases) </sub> <br>

#### What's New in 2.2.0.0
- **Added:** - Debug property: switches to FMOD's logging build (fmodstudioL) at runtime, no separate addon needed
- **Added:** - tools/patchFmodLibs.js: imports the FMOD HTML5 libraries from an SDK and re-applies the local fixes
- **Changed:** - FMOD now runs in a dedicated web worker. Mixing no longer depends on the main thread, so lag spikes, debugger pauses and other freezes in the game no longer stutter audio playback
- **Changed:** - Studio update runs on the worker's own clock instead of the runtime tick
- **Changed:** - Updated to FMOD 2.03.14
- **Changed:** - Both the release and logging libraries ship in the addon; only the selected one is loaded
- **Fixed:** - Unload Bank / Unload All Banks never completed (the bank handle is invalid as soon as FMOD unloads it, and the plugin kept polling it)
- **Fixed:** - Stopping an event with release did not actually release the FMOD instance, so instances piled up over time
- **Fixed:** - Node environment detection fix is now applied to the release library too (fixes crashes on NW.js-style hosts)

<sub>[View full changelog](#changelog)</sub>

---
<b><u>Author:</u></b> skymen <br>
<b>[Construct Addon Page](https://www.construct.net/en/make-games/addons/1207/fmod-js-api)</b>  <br>
<b>[Documentation](https://www.construct.net/en/make-games/addons/1207/fmod-js-api/documentation)</b>  <br>
<sub>Made using [CAW](https://marketplace.visualstudio.com/items?itemName=skymen.caw) </sub><br>

## Table of Contents
- [Usage](#usage)
- [Examples Files](#examples-files)
- [Properties](#properties)
- [Actions](#actions)
- [Conditions](#conditions)
- [Expressions](#expressions)
---
## Usage
To build the addon, run the following commands:

```
npm i
npm run build
```

To run the dev server, run

```
npm i
npm run dev
```

## Examples Files
| Description | Download |
| --- | --- |

---
## Properties
| Property Name | Description | Type |
| --- | --- | --- |
| Debug | Use the logging build of the FMOD library (fmodstudioL). FMOD's internal log is printed to the browser console. Larger and slower, keep it off for release builds. | check |


---
## Actions
| Action | Description | Params
| --- | --- | --- |


---
## Conditions
| Condition | Description | Params
| --- | --- | --- |


---
## Expressions
| Expression | Description | Return Type | Params
| --- | --- | --- | --- |


---
## Changelog

**2.2.0.0**
- **Added:** - Debug property: switches to FMOD's logging build (fmodstudioL) at runtime, no separate addon needed
- **Added:** - tools/patchFmodLibs.js: imports the FMOD HTML5 libraries from an SDK and re-applies the local fixes
- **Changed:** - FMOD now runs in a dedicated web worker. Mixing no longer depends on the main thread, so lag spikes, debugger pauses and other freezes in the game no longer stutter audio playback
- **Changed:** - Studio update runs on the worker's own clock instead of the runtime tick
- **Changed:** - Updated to FMOD 2.03.14
- **Changed:** - Both the release and logging libraries ship in the addon; only the selected one is loaded
- **Fixed:** - Unload Bank / Unload All Banks never completed (the bank handle is invalid as soon as FMOD unloads it, and the plugin kept polling it)
- **Fixed:** - Stopping an event with release did not actually release the FMOD instance, so instances piled up over time
- **Fixed:** - Node environment detection fix is now applied to the release library too (fixes crashes on NW.js-style hosts)

**2.1.3.3**
- **Fixed:** Fixed a bug that could cause naming conflicts on the domside

**2.1.3.2**
- **Fixed:** Should no longer crash on older versions of C3

**2.1.3.1**
- **Changed:** Moved to non debug version of the library

**2.1.3.0**
- **Added:** Start Event At Position
- **Fixed:** Bug where Start Event At Object could cause an audio glitch
