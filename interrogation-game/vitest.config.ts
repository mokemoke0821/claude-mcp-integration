import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    // 🧪 テスト環境設定
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,

    // 📊 カバレッジ設定 (目標: 90%+)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        }
      },
      exclude: [
        'node_modules/**',
        'dist/**',
        'build/**',
        'release/**',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/index.ts',
        'src/main.tsx',
        'vite.config.ts',
        'vitest.config.ts',
        'tailwind.config.js',
        'postcss.config.js'
      ]
    },

    // 🎯 テストファイルパターン
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules/**', 'dist/**', 'build/**'],

    // 🚀 パフォーマンス設定
    maxConcurrency: 8,
    testTimeout: 15000,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: true
      }
    },

    // 🔧 デバッグ&監視設定
    watch: false,
    passWithNoTests: false,
    silent: false,
    reporter: ['verbose', 'html'],
    outputFile: {
      html: './coverage/vitest-report.html'
    }
  }
}) 