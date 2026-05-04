import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";

function glsl() {
  return {
    name: "vite-plugin=glsl",
    transform(src: string, id: string) {
      if (id.endsWith(".glsl")) {
        return {
          code: `export default ${JSON.stringify(src)}`,
          map: null,
        };
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === "production" ? "/cfd-viewer/" : "/",
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), glsl()],
});
