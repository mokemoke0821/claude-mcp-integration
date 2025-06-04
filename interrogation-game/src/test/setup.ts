import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'

// 🧪 グローバル変数設定
declare global {
  var expect: typeof import('vitest').expect
  var describe: typeof import('vitest').describe
  var it: typeof import('vitest').it
  var test: typeof import('vitest').test
  var vi: typeof import('vitest').vi
  var beforeEach: typeof import('vitest').beforeEach
  var afterEach: typeof import('vitest').afterEach
  var beforeAll: typeof import('vitest').beforeAll
  var afterAll: typeof import('vitest').afterAll
}

// 🧪 テスト後のクリーンアップ
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.clearAllTimers()
})

// 🌐 グローバル設定
beforeAll(() => {
  // 🔒 セキュリティ: DOM環境の安全な設定
  Object.defineProperty(window, 'location', {
    value: {
      href: 'http://localhost:3001',
      origin: 'http://localhost:3001',
      protocol: 'http:',
      host: 'localhost:3001',
      hostname: 'localhost',
      port: '3001',
      pathname: '/',
      search: '',
      hash: '',
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn()
    },
    writable: true,
    configurable: true
  })

  // 🌐 Navigator API モック
  Object.defineProperty(window, 'navigator', {
    value: {
      userAgent: 'Mozilla/5.0 (Test Environment)',
      language: 'ja-JP',
      languages: ['ja-JP', 'en-US'],
      platform: 'Test',
      cookieEnabled: true,
      onLine: true
    },
    writable: true,
    configurable: true
  })

  // 💾 LocalStorage/SessionStorage モック
  const mockStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn()
  }
  Object.defineProperty(window, 'localStorage', { value: mockStorage })
  Object.defineProperty(window, 'sessionStorage', { value: mockStorage })

  // 🎨 CSS/Animation API モック
  Object.defineProperty(window, 'getComputedStyle', {
    value: () => ({
      getPropertyValue: () => '',
      display: 'block',
      visibility: 'visible',
      opacity: '1'
    })
  })

  // 📱 Intersection Observer モック
  global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: []
  }))

  // 🎯 Resize Observer モック
  global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }))

  // 🌐 Fetch API モック
  global.fetch = vi.fn()

  // 📊 Console管理（テスト環境での適切なログ制御）
  const originalError = console.error
  const originalWarn = console.warn

  console.error = (...args: unknown[]) => {
    // React DevToolsやuseEffect関連の警告は無視
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') ||
        args[0].includes('React DevTools') ||
        args[0].includes('validateDOMNesting'))
    ) {
      return
    }
    originalError.apply(console, args)
  }

  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('React DevTools') ||
        args[0].includes('componentWillReceiveProps'))
    ) {
      return
    }
    originalWarn.apply(console, args)
  }

  // ⏱️ タイマー設定
  vi.useFakeTimers()
})

afterAll(() => {
  // 🧹 テスト終了後のリソースクリーンアップ
  vi.clearAllMocks()
  vi.clearAllTimers()
  vi.useRealTimers()

  // メモリリーク防止
  cleanup()
}) 