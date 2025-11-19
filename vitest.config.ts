import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './vitest.setup.ts',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/tests/playwright/**',
      '**/playwright/**',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/lib/rag/__tests__/**',
      '**/lib/video/__tests__/transcription.test.ts',
      '**/lib/whop/roles.test.ts',
      '**/components/video/__tests__/LiteVideoPlayer.test.tsx',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        '.next/',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/*.config.js',
        '**/types/**',
        'scripts/**',
        'test-*.ts',
        'test-*.js',
        '**/__tests__/**',
        '**/dist/**',
        '**/coverage/**',
        'tests/**',
        'playwright/**',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
    // Increase timeout for tests that interact with external services
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
