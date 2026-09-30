import { defineConfig } from "vitest/config";

// Only our own tests: .whisper/ (the local whisper.cpp checkout) ships its own specs.
export default defineConfig({
  test: { include: ["src/**/*.test.ts", "scripts/**/*.test.ts"] },
});
