import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Deployment verification test: 2026-08-07
export default defineConfig({
  plugins: [react()],
})
