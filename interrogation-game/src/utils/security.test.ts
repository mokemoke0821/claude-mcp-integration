import { describe, expect, it, beforeEach, vi } from 'vitest'
import { SecurityUtils } from './security'

// 🧪 SecurityUtils エンタープライズ品質テスト
describe('SecurityUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('🔒 HTML Sanitization', () => {
    it('should sanitize malicious HTML content', () => {
      const maliciousInput = '<script>alert("xss")</script><p>Safe content</p>'
      const result = SecurityUtils.sanitizeHtml(maliciousInput)
      
      expect(result).not.toContain('<script>')
      expect(result).toContain('<p>Safe content</p>')
    })

    it('should allow safe HTML tags', () => {
      const safeInput = '<p><strong>Bold</strong> and <em>italic</em> text</p>'
      const result = SecurityUtils.sanitizeHtml(safeInput)
      
      expect(result).toBe(safeInput)
    })

    it('should remove dangerous attributes', () => {
      const dangerousInput = '<p onclick="alert(\'xss\')">Click me</p>'
      const result = SecurityUtils.sanitizeHtml(dangerousInput)
      
      expect(result).not.toContain('onclick')
      expect(result).toContain('<p>Click me</p>')
    })

    it('should strip comments', () => {
      const inputWithComments = '<p>Content</p><!-- malicious comment -->'
      const result = SecurityUtils.sanitizeHtml(inputWithComments)
      
      expect(result).not.toContain('<!--')
      expect(result).toContain('<p>Content</p>')
    })
  })

  describe('🔍 Input Validation', () => {
    it('should validate string inputs correctly', () => {
      expect(SecurityUtils.validateInput('valid string')).toBe(true)
      expect(SecurityUtils.validateInput('')).toBe(false)
      expect(SecurityUtils.validateInput(null)).toBe(false)
      expect(SecurityUtils.validateInput(undefined)).toBe(false)
      expect(SecurityUtils.validateInput(123)).toBe(false)
    })

    it('should reject extremely long strings', () => {
      const longString = 'a'.repeat(10001)
      expect(SecurityUtils.validateInput(longString)).toBe(false)
    })

    it('should accept strings within limit', () => {
      const validString = 'a'.repeat(1000)
      expect(SecurityUtils.validateInput(validString)).toBe(true)
    })
  })

  describe('🚫 SQL Injection Prevention', () => {
    it('should remove SQL injection patterns', () => {
      const sqlInjection = "'; DROP TABLE users; --"
      const result = SecurityUtils.sanitizeSQLInput(sqlInjection)
      
      expect(result).not.toContain("'")
      expect(result).not.toContain(';')
      expect(result).not.toContain('DROP')
      expect(result).not.toContain('--')
    })

    it('should remove SQL keywords', () => {
      const sqlKeywords = 'SELECT * FROM users UNION SELECT password'
      const result = SecurityUtils.sanitizeSQLInput(sqlKeywords)
      
      expect(result.toLowerCase()).not.toContain('select')
      expect(result.toLowerCase()).not.toContain('union')
    })

    it('should preserve safe content', () => {
      const safeInput = 'John Doe'
      const result = SecurityUtils.sanitizeSQLInput(safeInput)
      
      expect(result).toBe('John Doe')
    })
  })

  describe('📧 Email Validation', () => {
    it('should validate correct email addresses', () => {
      expect(SecurityUtils.validateEmail('user@example.com')).toBe(true)
      expect(SecurityUtils.validateEmail('test.email+tag@domain.co.uk')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(SecurityUtils.validateEmail('invalid-email')).toBe(false)
      expect(SecurityUtils.validateEmail('user@')).toBe(false)
      expect(SecurityUtils.validateEmail('@domain.com')).toBe(false)
      expect(SecurityUtils.validateEmail('')).toBe(false)
    })

    it('should reject extremely long email addresses', () => {
      const longEmail = 'a'.repeat(300) + '@example.com'
      expect(SecurityUtils.validateEmail(longEmail)).toBe(false)
    })
  })

  describe('🔐 Password Validation', () => {
    it('should validate strong passwords', () => {
      const strongPassword = 'StrongP@ssw0rd!'
      const result = SecurityUtils.validatePassword(strongPassword)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject weak passwords', () => {
      const weakPassword = 'weak'
      const result = SecurityUtils.validatePassword(weakPassword)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should require minimum length', () => {
      const shortPassword = 'Sh0rt!'
      const result = SecurityUtils.validatePassword(shortPassword)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('パスワードは8文字以上である必要があります')
    })

    it('should require uppercase letters', () => {
      const noUppercase = 'lowercase123!'
      const result = SecurityUtils.validatePassword(noUppercase)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('大文字を含める必要があります')
    })

    it('should require special characters', () => {
      const noSpecial = 'Password123'
      const result = SecurityUtils.validatePassword(noSpecial)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('特殊文字を含める必要があります')
    })
  })

  describe('🌐 URL Validation', () => {
    it('should validate correct URLs', () => {
      expect(SecurityUtils.validateUrl('https://example.com')).toBe(true)
      expect(SecurityUtils.validateUrl('http://localhost:3000')).toBe(true)
    })

    it('should reject invalid URLs', () => {
      expect(SecurityUtils.validateUrl('not-a-url')).toBe(false)
      expect(SecurityUtils.validateUrl('ftp://example.com')).toBe(false)
      expect(SecurityUtils.validateUrl('javascript:alert(1)')).toBe(false)
    })

    it('should require protocol', () => {
      expect(SecurityUtils.validateUrl('example.com')).toBe(false)
    })
  })

  describe('🔢 Number Validation', () => {
    it('should validate numbers correctly', () => {
      expect(SecurityUtils.validateNumber(42)).toBe(true)
      expect(SecurityUtils.validateNumber(0)).toBe(true)
      expect(SecurityUtils.validateNumber(-10)).toBe(true)
    })

    it('should reject non-numbers', () => {
      expect(SecurityUtils.validateNumber('42')).toBe(false)
      expect(SecurityUtils.validateNumber(null)).toBe(false)
      expect(SecurityUtils.validateNumber(undefined)).toBe(false)
      expect(SecurityUtils.validateNumber(NaN)).toBe(false)
      expect(SecurityUtils.validateNumber(Infinity)).toBe(false)
    })

    it('should validate number ranges', () => {
      expect(SecurityUtils.validateNumber(5, 1, 10)).toBe(true)
      expect(SecurityUtils.validateNumber(0, 1, 10)).toBe(false)
      expect(SecurityUtils.validateNumber(15, 1, 10)).toBe(false)
    })
  })

  describe('🆔 UUID Validation', () => {
    it('should validate correct UUIDs', () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000'
      expect(SecurityUtils.validateUUID(validUUID)).toBe(true)
    })

    it('should reject invalid UUIDs', () => {
      expect(SecurityUtils.validateUUID('invalid-uuid')).toBe(false)
      expect(SecurityUtils.validateUUID('123-456-789')).toBe(false)
      expect(SecurityUtils.validateUUID('')).toBe(false)
    })
  })

  describe('📱 JSON Sanitization', () => {
    it('should parse and sanitize valid JSON', () => {
      const validJSON = '{"name": "John", "message": "<script>alert(1)</script>"}'
      const result = SecurityUtils.sanitizeJSON(validJSON)
      
      expect(result).toBeTruthy()
      expect((result as any).name).toBe('John')
      expect((result as any).message).not.toContain('<script>')
    })

    it('should reject invalid JSON', () => {
      const invalidJSON = '{"invalid": json}'
      const result = SecurityUtils.sanitizeJSON(invalidJSON)
      
      expect(result).toBeNull()
    })

    it('should reject deeply nested objects', () => {
      const deepObject = JSON.stringify({
        level1: { level2: { level3: { level4: { level5: { level6: { level7: { level8: { level9: { level10: { level11: 'too deep' } } } } } } } } } }
      })
      const result = SecurityUtils.sanitizeJSON(deepObject)
      
      expect(result).toBeNull()
    })
  })

  describe('⏱️ Rate Limiting', () => {
    it('should allow requests within limit', () => {
      const identifier = 'test-user'
      
      for (let i = 0; i < 5; i++) {
        expect(SecurityUtils.checkRateLimit(identifier, 10, 60000)).toBe(true)
      }
    })

    it('should block requests exceeding limit', () => {
      const identifier = 'rate-limited-user'
      
      // 制限まで到達
      for (let i = 0; i < 3; i++) {
        SecurityUtils.checkRateLimit(identifier, 3, 60000)
      }
      
      // 制限を超える
      expect(SecurityUtils.checkRateLimit(identifier, 3, 60000)).toBe(false)
    })

    it('should reset after time window', () => {
      const identifier = 'time-window-user'
      
      // 制限まで到達
      for (let i = 0; i < 2; i++) {
        SecurityUtils.checkRateLimit(identifier, 2, 100)
      }
      
      // 時間経過をシミュレート
      vi.advanceTimersByTime(150)
      
      // 再度許可される
      expect(SecurityUtils.checkRateLimit(identifier, 2, 100)).toBe(true)
    })
  })

  describe('🛡️ CSP Nonce Generation', () => {
    it('should generate valid nonce', () => {
      const nonce = SecurityUtils.generateCSPNonce()
      
      expect(nonce).toBeTruthy()
      expect(typeof nonce).toBe('string')
      expect(nonce.length).toBe(32) // 16 bytes * 2 hex chars
      expect(/^[a-f0-9]+$/.test(nonce)).toBe(true)
    })

    it('should generate unique nonces', () => {
      const nonce1 = SecurityUtils.generateCSPNonce()
      const nonce2 = SecurityUtils.generateCSPNonce()
      
      expect(nonce1).not.toBe(nonce2)
    })
  })

  describe('🔐 Session Validation', () => {
    it('should validate correct session IDs', () => {
      const validSessionId = '123e4567-e89b-12d3-a456-426614174000'
      expect(SecurityUtils.validateSession(validSessionId)).toBe(true)
    })

    it('should reject invalid session IDs', () => {
      expect(SecurityUtils.validateSession('invalid-session')).toBe(false)
      expect(SecurityUtils.validateSession('')).toBe(false)
      expect(SecurityUtils.validateSession('123-456')).toBe(false)
    })
  })
}) 