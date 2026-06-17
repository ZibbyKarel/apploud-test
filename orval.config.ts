import { defineConfig } from "orval";

export default defineConfig({
  gitlab: {
    input: {
      target: "./api.yaml",
      override: {
        // Prune the full GitLab spec down to the 5 endpoints we use and fix the
        // list-response array types. See scripts/orval-transformer.cjs.
        transformer: "./scripts/orval-transformer.cjs",
      },
    },
    output: {
      mode: "tags-split",
      client: "fetch",
      target: "./src/api/generated",
      schemas: "./src/api/generated/model",
      clean: true,
      prettier: false,
      override: {
        mutator: {
          path: "./src/api/mutator.ts",
          name: "customFetch",
        },
        fetch: {
          // Return { status, data, headers } so we can read pagination headers.
          includeHttpResponseReturnType: true,
        },
      },
    },
  },
});
