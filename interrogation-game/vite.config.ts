import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { defineConfig, splitVendorChunkPlugin } from 'vite'

export default defineConfig({
  plugins: [
    react({
      // ⚡ React最適化
      babel: {
        plugins: [
          // デッドコード除去
          ['babel-plugin-transform-remove-console', { exclude: ['error', 'warn'] }]
        ]
      }
    }),
    // 🔄 vendor chunk分割最適化
    splitVendorChunkPlugin()
  ],

  root: '.',
  publicDir: 'public',

  // 🔗 パス解決設定
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/ui/components'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@types': resolve(__dirname, 'src/types'),
      '@game': resolve(__dirname, 'src/game'),
      '@test': resolve(__dirname, 'src/test')
    }
  },

  server: {
    port: 3001,
    host: true,
    strictPort: true,

    // 🔒 セキュリティヘッダー強化 (エンタープライズ品質)
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "font-src 'self' data:",
        "img-src 'self' data: blob:",
        "connect-src 'self' http://localhost:11434 ws://localhost:3001",
        "worker-src 'self' blob:",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; '),
      'Permissions-Policy': [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'payment=()',
        'usb=()',
        'magnetometer=()',
        'gyroscope=()',
        'speaker=()',
        'ambient-light-sensor=()',
        'accelerometer=()'
      ].join(', '),
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin'
    },

    proxy: {
      '/api/ollama': {
        target: 'http://localhost:11434',
        changeOrigin: true,
        secure: false,
        timeout: 30000,
        rewrite: (path) => path.replace(/^\/api\/ollama/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('Proxy error:', err)
          })
        }
      }
    }
  },

  build: {
    // 🚀 ビルド最適化 (エンタープライズ品質)
    target: ['es2022', 'chrome100', 'safari15', 'firefox100'],
    minify: 'esbuild',
    sourcemap: process.env.NODE_ENV === 'production' ? false : 'inline',
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 500,

    // 📊 出力設定
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,

    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },

      output: {
        // 🔧 チャンク分割戦略
        manualChunks: (id) => {
          // vendor chunk: node_modules
          if (id.includes('node_modules')) {
            if (id.includes('react')) {
              return 'react-vendor'
            }
            if (id.includes('framer-motion')) {
              return 'animation-vendor'
            }
            if (id.includes('zustand')) {
              return 'state-vendor'
            }
            if (id.includes('axios')) {
              return 'http-vendor'
            }
            return 'vendor'
          }

          // feature chunk: アプリケーション機能別
          if (id.includes('/game/')) {
            return 'game-feature'
          }
          if (id.includes('/ui/')) {
            return 'ui-feature'
          }
          if (id.includes('/stores/')) {
            return 'store-feature'
          }
        },

        // 📝 ファイル名パターン
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.ts', '').replace('.tsx', '')
            : 'chunk'
          return `js/${facadeModuleId}-[hash].js`
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') ?? []
          const ext = info[info.length - 1]

          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`
          }
          if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
            return `fonts/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        }
      },

      // 🔒 外部依存関係
      external: [],

      // ⚡ tree shaking最適化
      treeshake: {
        preset: 'recommended',
        moduleSideEffects: false
      }
    }
  },

  // 🎯 依存関係最適化
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'axios',
      'framer-motion',
      'zustand',
      'zustand/middleware',
      'dompurify',
      'validator'
    ],
    exclude: ['@vitejs/plugin-react']
  },

  // 🔧 CSS設定
  css: {
    postcss: './postcss.config.js',
    devSourcemap: true,
    modules: {
      localsConvention: 'camelCase'
    }
  },

  // 📊 プレビュー設定
  preview: {
    port: 3002,
    host: true,
    strictPort: true,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  },

  // 🔍 定義
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
  }
})