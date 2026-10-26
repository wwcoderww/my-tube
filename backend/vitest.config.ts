import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Enables global test methods like describe, it, and expect (removes need to import them)
    globals: true,
    environment: "node",
  },
});
