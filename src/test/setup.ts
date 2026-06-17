import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Unmount and clear the DOM between tests (we don't enable Vitest globals, so
// Testing Library can't auto-register this).
afterEach(() => {
  cleanup();
});
