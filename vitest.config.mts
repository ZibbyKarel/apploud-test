import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

// Component tests need a DOM + JSX transform; the React plugin provides the
// automatic JSX runtime and `tsconfigPaths` resolves the `@/*` alias used in
// imports. Pure-function tests run fine under jsdom too, so it's the global env.
//
// Kept deliberately independent of Storybook's `addon-vitest` browser-test
// integration: these are plain RTL/jsdom unit tests, and pulling in the
// Playwright browser workspace adds peer-dep surface we don't need here.
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    // Playwright specs live in ./e2e and use Playwright's own `test`/`expect`;
    // keep Vitest from trying to collect them.
    exclude: ["**/node_modules/**", "**/dist/**", "e2e/**"],
  },
});
