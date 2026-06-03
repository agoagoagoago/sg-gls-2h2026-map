import { defineConfig } from "vite";

// Static, single-page build. `base: "./"` keeps asset URLs relative so the
// site works whether served from a domain root (Render) or a sub-path.
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    sourcemap: false,
    target: "es2020",
  },
});
