import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'lib/**',
        'services/**',
        'repositories/**',
        'config/**',
      ],
      exclude: [
        'services/ai/providers/future-providers.ts',
        'services/projects/**',
        'services/tasks/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
