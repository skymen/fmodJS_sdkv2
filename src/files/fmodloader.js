// Records where the FMOD library files live so the DOM side can load the
// right variant (release / logging / threaded) at runtime. Construct serves
// this script and the copy-to-output files from the same folder.
(() => {
  const script = document.currentScript;
  globalThis.__skymen_fmod_libBase =
    script && script.src ? new URL(".", script.src).href : "";
})();
