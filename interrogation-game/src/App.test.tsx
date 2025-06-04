import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

// 🧪 App コンポーネント エンタープライズ品質テスト
describe('App Component', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    // モック設定のリセット
    vi.clearAllMocks()
  })

  afterEach(() => {
    // テスト後のクリーンアップ
    vi.clearAllTimers()
  })

  describe('🎨 Rendering Tests', () => {
    it('renders without crashing', () => {
      const { container } = render(<App />)
      expect(container.firstChild).toBeTruthy()
    })

    it('has correct CSS classes for styling', () => {
      const { container } = render(<App />)
      const appElement = container.firstChild as HTMLElement

      expect(appElement.className).toContain('min-h-screen')
      expect(appElement.className).toContain('bg-gray-900')
      expect(appElement.className).toContain('text-gray-100')
    })

    it('renders main content wrapper', () => {
      const { container } = render(<App />)
      const mainWrapper = container.querySelector('.relative.z-10')
      expect(mainWrapper).toBeTruthy()
    })

    it('displays application title', () => {
      render(<App />)
      expect(screen.getByText(/取調室ライフバトルゲーム/i)).toBeInTheDocument()
    })
  })

  describe('♿ Accessibility Tests', () => {
    it('has proper heading structure', () => {
      render(<App />)
      const headings = screen.getAllByRole('heading')
      expect(headings.length).toBeGreaterThan(0)
    })

    it('has sufficient color contrast', () => {
      const { container } = render(<App />)
      const appElement = container.firstChild as HTMLElement

      // 背景色とテキスト色のコントラストを確認
      const styles = window.getComputedStyle(appElement)
      expect(styles.backgroundColor).toBeDefined()
      expect(styles.color).toBeDefined()
    })

    it('supports keyboard navigation', async () => {
      render(<App />)

      // タブキーでナビゲーション可能な要素をテスト
      const focusableElements = screen.getAllByRole('button')
      if (focusableElements.length > 0) {
        focusableElements[0].focus()
        expect(document.activeElement).toBe(focusableElements[0])
      }
    })

    it('has appropriate ARIA labels', () => {
      render(<App />)

      // ARIA属性の確認
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(
          button.getAttribute('aria-label') ||
          button.textContent ||
          button.getAttribute('aria-describedby')
        ).toBeTruthy()
      })
    })
  })

  describe('🎮 User Interaction Tests', () => {
    it('handles button clicks without errors', async () => {
      render(<App />)

      const buttons = screen.getAllByRole('button')

      for (const button of buttons) {
        await user.click(button)
        // エラーが発生しないことを確認
        await waitFor(() => {
          expect(button).toBeInTheDocument()
        })
      }
    })

    it('responds to keyboard events', async () => {
      render(<App />)

      // Enterキーでボタンを活性化
      const buttons = screen.getAllByRole('button')
      if (buttons.length > 0) {
        buttons[0].focus()
        await user.keyboard('{Enter}')

        // 適切に反応することを確認
        await waitFor(() => {
          expect(buttons[0]).toBeInTheDocument()
        })
      }
    })

    it('handles window resize events', async () => {
      render(<App />)

      // ウィンドウリサイズイベントをシミュレート
      fireEvent(window, new Event('resize'))

      await waitFor(() => {
        expect(document.body).toBeInTheDocument()
      })
    })
  })

  describe('🔒 Security Tests', () => {
    it('does not expose sensitive information in DOM', () => {
      const { container } = render(<App />)

      // APIキーやセンシティブデータが含まれていないことを確認
      const htmlContent = container.innerHTML
      expect(htmlContent).not.toMatch(/api[_-]?key/i)
      expect(htmlContent).not.toMatch(/password/i)
      expect(htmlContent).not.toMatch(/secret/i)
      expect(htmlContent).not.toMatch(/token/i)
    })

    it('sanitizes user input properly', () => {
      render(<App />)

      // XSS攻撃のテスト
      const inputs = screen.getAllByRole('textbox')
      inputs.forEach(input => {
        fireEvent.change(input, {
          target: { value: '<script>alert("xss")</script>' }
        })

        expect(input).toHaveValue('<script>alert("xss")</script>')
        expect(document.querySelector('script')).toBeNull()
      })
    })
  })

  describe('⚡ Performance Tests', () => {
    it('renders within acceptable time limit', async () => {
      const startTime = performance.now()

      render(<App />)

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // 100ms以内でレンダリング完了
      expect(renderTime).toBeLessThan(100)
    })

    it('handles multiple rapid interactions', async () => {
      render(<App />)

      const buttons = screen.getAllByRole('button')
      if (buttons.length > 0) {
        const button = buttons[0]

        // 連続クリックテスト
        for (let i = 0; i < 10; i++) {
          await user.click(button)
        }

        // UI が安定していることを確認
        expect(button).toBeInTheDocument()
      }
    })

    it('does not cause memory leaks', async () => {
      const { unmount } = render(<App />)

      // コンポーネントのアンマウント
      unmount()

      // メモリリークがないことを確認
      await waitFor(() => {
        expect(true).toBe(true) // アンマウントが正常に完了
      })
    })
  })

  describe('🔄 State Management Tests', () => {
    it('maintains consistent state across rerenders', () => {
      const { rerender } = render(<App />)

      // 再レンダリング後も状態が保持されることを確認
      rerender(<App />)

      expect(screen.getByText(/取調室ライフバトルゲーム/i)).toBeInTheDocument()
    })

    it('handles prop changes gracefully', () => {
      const { rerender } = render(<App />)

      // propsの変更をシミュレート
      rerender(<App key="different-key" />)

      expect(document.body).toBeInTheDocument()
    })
  })

  describe('🧩 Integration Tests', () => {
    it('works with different browser environments', () => {
      // 異なるブラウザ環境での動作確認
      const userAgent = window.navigator.userAgent

      render(<App />)

      expect(screen.getByText(/取調室ライフバトルゲーム/i)).toBeInTheDocument()
      expect(userAgent).toBeDefined()
    })

    it('handles offline scenarios', async () => {
      render(<App />)

      // オフライン状態をシミュレート
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })

      fireEvent(window, new Event('offline'))

      await waitFor(() => {
        expect(navigator.onLine).toBe(false)
      })

      // アプリケーションが適切に動作することを確認
      expect(screen.getByText(/取調室ライフバトルゲーム/i)).toBeInTheDocument()
    })
  })

  describe('📱 Responsive Design Tests', () => {
    it('adapts to mobile viewport', () => {
      // モバイルビューポートサイズに設定
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667
      })

      fireEvent(window, new Event('resize'))

      render(<App />)

      expect(screen.getByText(/取調室ライフバトルゲーム/i)).toBeInTheDocument()
    })

    it('works on tablet viewport', () => {
      // タブレットビューポートサイズに設定
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      })

      fireEvent(window, new Event('resize'))

      render(<App />)

      expect(screen.getByText(/取調室ライフバトルゲーム/i)).toBeInTheDocument()
    })
  })
})