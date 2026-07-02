import { defineConfig } from "vite";

// base: "./" produces relative asset URLs so the same build works both at a
// root domain (Vercel: staxxs.vercel.app) and a subpath (GitHub Pages: /Staxxs/).
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    sourcemap: false,
    target: "es2020",
  },
});
