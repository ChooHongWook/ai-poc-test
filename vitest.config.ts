import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts", "src/**/*.tsx", "app/**/*.ts"],
      exclude: [
        "src/app/components/ui/**",
        "src/app/components/figma/**",
        "**/*.d.ts",
        "**/*.test.*",
        "**/*.spec.*",
        "src/test/**",
      ],
    },
    include: ["src/**/*.test.{ts,tsx}", "app/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
