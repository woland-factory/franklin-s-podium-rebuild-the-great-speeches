/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Single source of truth for the cross-origin-isolation + CSP header set.
// nginx.conf mirrors these exact values for production; the dev/preview
// servers below serve them so E2E can assert the same policy.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "worker-src 'self' blob:",
  "connect-src 'self' blob:",
  "img-src 'self' data:",
  "media-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join("; ");

const isolationHeaders = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Content-Security-Policy": CSP,
};

export default defineConfig({
  plugins: [react()],
  build: {
    // No inline module-preload polyfill, so script-src stays 'self' only.
    modulePreload: { polyfill: false },
    target: "es2020",
  },
  server: { host: "127.0.0.1", headers: isolationHeaders },
  preview: { host: "127.0.0.1", headers: isolationHeaders },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
  },
});
