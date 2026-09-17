import * as chalkUtils from "./chalkUtils.js";
import doVite from "./vite.js";
import fromConsole from "./fromConsole.js";
import { files } from "../config.caw.js";
import fs from "fs";
import path from "path";
import { defineConfig } from "vite";

// File dependencies with a `bundle` field are module entries (e.g. a web
// worker) that get vite-bundled into a self-contained classic script named
// after the dependency, then shipped like any other copy-to-output file.
export default async function buildBundledDependencies() {
  const bundled = (files.fileDependencies || []).filter((file) => file.bundle);
  if (bundled.length === 0) return false;

  chalkUtils.step("Vite bundled dependencies build");

  for (const file of bundled) {
    const entry = path.resolve("..", file.bundle);
    if (!fs.existsSync(entry)) {
      chalkUtils.error(
        `Bundle entry not found: ${chalkUtils._errorUnderline(entry)}`
      );
      return true;
    }
    const name = path.parse(file.filename).name;
    const hadError = await doVite(
      defineConfig({
        build: {
          outDir: "../generated",
          emptyOutDir: false,
          rollupOptions: {
            preserveEntrySignatures: false,
            input: { [name]: entry },
            output: {
              entryFileNames: "[name].js",
              format: "iife",
            },
          },
        },
      })
    );
    if (hadError) return true;
  }
  return false;
}

// if is being called from the command line
if (fromConsole(import.meta.url)) {
  chalkUtils.fromCommandLine();
  buildBundledDependencies();
}
