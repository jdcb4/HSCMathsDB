import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import tailwindcss from "tailwindcss";

export default defineConfig({
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()]
    }
  },
  plugins: [react(), llmExplanationSamplesPlugin()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.ts"]
  }
});

function llmExplanationSamplesPlugin() {
  return {
    name: "goalcheck-llm-explanation-samples",
    apply: "serve" as const,
    configureServer(server: { middlewares: { use: (route: string, handler: DevMiddleware) => void } }) {
      server.middlewares.use("/__dev/llm-explanation-samples", (_request, response) => {
        const samplesPath = path.resolve("var", "llm-explanation-samples", "samples.json");

        if (!existsSync(samplesPath)) {
          response.statusCode = 404;
          response.setHeader("Content-Type", "application/json");
          response.end(
            JSON.stringify({
              error: "Sample data not found. Run pnpm run data:generate-explanation-samples first."
            })
          );
          return;
        }

        response.setHeader("Content-Type", "application/json");
        response.end(readFileSync(samplesPath, "utf8"));
      });
    }
  };
}

type DevMiddleware = (
  request: unknown,
  response: {
    statusCode: number;
    setHeader: (name: string, value: string) => void;
    end: (body: string) => void;
  }
) => void;
