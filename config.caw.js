import {
  ADDON_CATEGORY,
  ADDON_TYPE,
  PLUGIN_TYPE,
  PROPERTY_TYPE,
} from "./template/enums.js";
import _version from "./version.js";
export const addonType = ADDON_TYPE.PLUGIN;
export const type = PLUGIN_TYPE.OBJECT;
export const id = "skymen_fmod_js";
export const name = "(FMOD) JS API";
export const version = _version;
export const minConstructVersion = undefined;
export const author = "skymen";
export const website = "https://github.com/skymen/fmodJS_sdkv2";
export const documentation =
  "https://www.construct.net/en/make-games/addons/1207/fmod-js-api/documentation";
export const description = "JS Implementation of FMOD for Construct 3";
export const category = ADDON_CATEGORY.MEDIA;

export const hasDomside = true;
export const files = {
  extensionScript: {},
  fileDependencies: [
    {
      filename: "fmodloader.js",
      type: "external-dom-script",
    },
    // FMOD runs in this worker (bundled from src/worker/index.js)
    {
      filename: "fmodworker.js",
      type: "copy-to-output",
      fileType: "text/javascript",
      bundle: "src/worker/index.js",
    },
    // Library variants, picked at runtime by the DOM side (see LoadLibrary):
    // fmodstudio = release, fmodstudioL = release + logging.
    // Only the selected variant is ever fetched.
    ...["fmodstudio", "fmodstudioL"].flatMap(
      (name) => [
        {
          filename: `${name}.js`,
          type: "copy-to-output",
          fileType: "text/javascript",
        },
        {
          filename: `${name}.wasm`,
          type: "copy-to-output",
          fileType: "application/wasm",
        },
      ]
    ),
  ],
};

// categories that are not filled will use the folder name
export const aceCategories = {};

export const info = {
  // icon: "icon.svg",
  // PLUGIN world only
  // defaultImageUrl: "default-image.png",
  Set: {
    // COMMON to all
    CanBeBundled: true,
    IsDeprecated: false,
    GooglePlayServicesEnabled: false,

    // BEHAVIOR only
    IsOnlyOneAllowed: false,

    // PLUGIN world only
    IsResizable: false,
    IsRotatable: false,
    Is3D: false,
    HasImage: false,
    IsTiled: false,
    SupportsZElevation: false,
    SupportsColor: false,
    SupportsEffects: false,
    MustPreDraw: false,

    // PLUGIN object only
    IsSingleGlobal: true,
  },
  // PLUGIN only
  AddCommonACEs: {
    Position: false,
    SceneGraph: false,
    Size: false,
    Angle: false,
    Appearance: false,
    ZOrder: false,
  },
};

export const properties = [
  {
    type: PROPERTY_TYPE.CHECK,
    id: "debug",
    options: {
      initialValue: false,
    },
    name: "Debug",
    desc: "Use the logging build of the FMOD library (fmodstudioL). FMOD's internal log is printed to the browser console. Larger and slower, keep it off for release builds.",
  },
]
