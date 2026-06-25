import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Opt-in (SQP_TUNNEL=1): expose on the LAN and accept tunnel hostnames
    // (e.g. a cloudflared quick tunnel) for testing on other devices.
    host: process.env.SQP_TUNNEL ? true : undefined,
    allowedHosts: process.env.SQP_TUNNEL ? true : undefined,
    proxy: {
      '/api': 'http://localhost:4177',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
