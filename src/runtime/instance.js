import { id } from "../../config.caw.js";

export default function (parentClass) {
  return class extends parentClass {
    constructor() {
      super();
      const properties = this._getInitProperties();
      if (properties) {
      }

      if (!C3.Plugins.skymen_fmod) {
        alert(
          "FMOD_JS: This implementation does nothing on its own. Please install the FMOD plugin."
        );
      }

      globalThis.__skymen_fmod_js = this;
    }

    SendMessage(id, data) {
      this._postToDOMMaybeSync(id, data);
    }

    SendMessageAsync(id, data) {
      return this._postToDOMAsync(id, data);
    }

    HandleMessage(id, callback) {
      this._addDOMMessageHandler(id, callback);
    }

    HandleMessages(arr) {
      this._addDOMMessageHandlers(arr);
    }

    _trigger(method) {
      super._trigger(self.C3.Plugins[id].Cnds[method]);
    }

    _release() {
      super._release();
    }

    _saveToJson() {
      return {
        // data to be saved for savegames
      };
    }

    _loadFromJson(o) {
      // load state for savegames
    }
  };
}
