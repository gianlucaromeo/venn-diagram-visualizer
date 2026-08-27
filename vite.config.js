import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // The core is pure and runs under node; component tests opt into
    // jsdom via a per-file `@vitest-environment` comment.
    environment: 'node',
  },
})
