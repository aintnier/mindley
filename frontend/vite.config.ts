import { defineConfig } from 'vitest/config';
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
  server: {
    host: '0.0.0.0', // Espone il server su tutte le interfacce di rete
    port: 5173,
    watch: {
      usePolling: true, // Necessario per WSL e alcuni file system
      interval: 100, // Frequenza di polling in ms
    },
    hmr: {
      overlay: true, // Mostra errori in overlay
    },
  },
});
