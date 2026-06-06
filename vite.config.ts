import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";

export default defineConfig({
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()]
    }
  },
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.ts"]
  }
});
