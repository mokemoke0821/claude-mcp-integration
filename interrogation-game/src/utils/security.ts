import DOMPurify from 'dompurify'
import validator from 'validator'

// 🔒 入力検証とサニタイゼーション
export class SecurityUtils {

  // 📝 HTMLサニタイゼーション (XSS対策)
  static sanitizeHtml(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'span'],
      ALLOWED_ATTR: ['class', 'style'],
      FORBID_SCRIPTS: true,
      FORBID_TAGS: ['script', 'object', 'embed', 'link', 'style', 'img', 'svg'],
      STRIP_COMMENTS: true
    })
  }

  // 🔍 入力文字列の基本検証
  static validateInput(input: unknown): input is string {
    return typeof input === 'string' && input.length > 0 && input.length <= 10000
  }

  // 🚫 SQLインジェクション対策
  static sanitizeSQLInput(input: string): string {
    // 危険な文字をエスケープ
    return input
      .replace(/['";\\]/g, '')
      .replace(/(--)|(\/\*)|(\*\/)/g, '')
      .replace(/(union|select|insert|update|delete|drop|create|alter|execute|script)/gi, '')
      .trim()
  }

  // 📧 Email検証
  static validateEmail(email: string): boolean {
    return validator.isEmail(email) && email.length <= 320
  }

  // 🔐 パスワード強度チェック
  static validatePassword(password: string): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('パスワードは8文字以上である必要があります')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('大文字を含める必要があります')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('小文字を含める必要があります')
    }

    if (!/[0-9]/.test(password)) {
      errors.push('数字を含める必要があります')
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('特殊文字を含める必要があります')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // 🌐 URL検証
  static validateUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url)
      return ['http:', 'https:'].includes(parsedUrl.protocol) &&
        validator.isURL(url, {
          protocols: ['http', 'https'],
          require_protocol: true,
          require_host: true,
          require_valid_protocol: true
        })
    } catch {
      return false
    }
  }

  // 🔢 数値検証
  static validateNumber(value: unknown, min?: number, max?: number): value is number {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      return false
    }

    if (min !== undefined && value < min) {
      return false
    }

    if (max !== undefined && value > max) {
      return false
    }

    return true
  }

  // 🆔 UUID検証
  static validateUUID(uuid: string): boolean {
    return validator.isUUID(uuid, 4)
  }

  // 📱 JSON検証とサニタイゼーション
  static sanitizeJSON(input: string): object | null {
    try {
      const parsed = JSON.parse(input)

      // オブジェクトの深さ制限（DoS攻撃対策）
      if (this.getObjectDepth(parsed) > 10) {
        throw new Error('Object too deep')
      }

      // 文字列プロパティのサニタイゼーション
      return this.sanitizeObjectStrings(parsed)
    } catch {
      return null
    }
  }

  // 🏗️ オブジェクト深度計算
  private static getObjectDepth(obj: any, depth = 0): number {
    if (depth > 10) return depth // 制限値

    if (obj === null || typeof obj !== 'object') {
      return depth
    }

    let maxDepth = depth
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const currentDepth = this.getObjectDepth(obj[key], depth + 1)
        maxDepth = Math.max(maxDepth, currentDepth)
      }
    }

    return maxDepth
  }

  // 🧹 オブジェクト内文字列サニタイゼーション
  private static sanitizeObjectStrings(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeHtml(obj)
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObjectStrings(item))
    }

    if (obj !== null && typeof obj === 'object') {
      const sanitized: any = {}
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = this.sanitizeObjectStrings(obj[key])
        }
      }
      return sanitized
    }

    return obj
  }

  // ⏱️ レート制限チェック（簡易版）
  private static requestTimestamps = new Map<string, number[]>()

  static checkRateLimit(identifier: string, maxRequests = 100, windowMs = 60000): boolean {
    const now = Date.now()
    const windowStart = now - windowMs

    if (!this.requestTimestamps.has(identifier)) {
      this.requestTimestamps.set(identifier, [])
    }

    const timestamps = this.requestTimestamps.get(identifier)!

    // 古いタイムスタンプを削除
    const recentTimestamps = timestamps.filter(timestamp => timestamp > windowStart)

    if (recentTimestamps.length >= maxRequests) {
      return false // レート制限に達している
    }

    recentTimestamps.push(now)
    this.requestTimestamps.set(identifier, recentTimestamps)

    return true
  }

  // 🛡️ CSP (Content Security Policy) ヘルパー
  static generateCSPNonce(): string {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  // 🔐 セッション管理
  static validateSession(sessionId: string): boolean {
    return this.validateUUID(sessionId) && sessionId.length === 36
  }
}

// 🎯 型定義エクスポート
export interface SecurityValidationResult {
  isValid: boolean
  errors?: string[]
  sanitizedValue?: any
}

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  identifier: string
} 