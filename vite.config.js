import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const UPSTREAM = process.env.VITE_UPSTREAM || 'https://7movies.ac';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: UPSTREAM,
        changeOrigin: true,
        secure: true,
        headers: {
          Origin: UPSTREAM,
          Referer: UPSTREAM + '/'
        }
      }
    }
  }
});