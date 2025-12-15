import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    passWithNoTests: false,
    hookTimeout: 20000,
    coverage: {
      provider: "istanbul",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      // opcional: filtra solo código de app
      include: ["app/**/*.{ts,tsx}"],
      exclude: [
        "tests/**/*",
        "dist/**/*",
        "node_modules/**/*",
        "**/*.d.ts"
      ],
    },
  },
});
