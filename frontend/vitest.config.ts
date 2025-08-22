/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    // Use different setup based on test type
    setupFiles: process.env.VITEST_INTEGRATION 
      ? './src/test/integration.setup.ts'
      : './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.ts',
        'src/main.tsx',
        'src/vite-env.d.ts'
      ]
    },
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    // Longer timeout for integration tests that hit real backend
    testTimeout: process.env.VITEST_INTEGRATION ? 60000 : 30000,
    server: {
      deps: {
        inline: ['@testing-library/jest-dom']
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})