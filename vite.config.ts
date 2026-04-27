import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";

// https://vite.dev/config/
export default defineConfig({
  base: "cfd-viewer",
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
});
