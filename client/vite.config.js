import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const backendPort = process.env.VITE_BACKEND_PORT || process.env.PORT || 5000;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Lets the app call "/api/..." in dev without CORS or absolute URLs.
    proxy: {
      '/api': `http://localhost:${backendPort}`,
    },
  },
});
