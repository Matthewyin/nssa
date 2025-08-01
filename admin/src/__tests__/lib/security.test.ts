import {
  validatePasswordStrength,
  sanitizeInput,
  validateFileType,
  generateSecureToken,
  generateCSRFToken,
  validateCSRFToken,
  validateIPAddress,
  isTrustedIP,
} from '@/lib/security'

describe('Security Utils', () => {
  describe('validatePasswordStrength', () => {
    it('should validate strong password', () => {
      const result = validatePasswordStrength('StrongPass123!')
      expect(result.valid).toBe(true)
      expect(result.score).toBeGreaterThan(80)
      expect(result.issues).toHaveLength(0)
    })

    it('should reject weak password', () => {
      const result = validatePasswordStrength('weak')
      expect(result.valid).toBe(false)
      expect(result.score).toBeLessThan(50)
      expect(result.issues.length).toBeGreaterThan(0)
    })

    it('should require minimum length', () => {
      const result = validatePasswordStrength('Aa1!')
      expect(result.valid).toBe(false)
      expect(result.issues).toContain('密码长度至少8位')
    })

    it('should require uppercase letters', () => {
      const result = validatePasswordStrength('lowercase123!')
      expect(result.valid).toBe(false)
      expect(result.issues).toContain('密码必须包含大写字母')
    })

    it('should require lowercase letters', () => {
      const result = validatePasswordStrength('UPPERCASE123!')
      expect(result.valid).toBe(false)
      expect(result.issues).toContain('密码必须包含小写字母')
    })

    it('should require numbers', () => {
      const result = validatePasswordStrength('NoNumbers!')
      expect(result.valid).toBe(false)
      expect(result.issues).toContain('密码必须包含数字')
    })
  })

  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      const result = sanitizeInput('<script>alert("xss")</script>Hello')
      expect(result).toBe('scriptalert("xss")/scriptHello')
    })

    it('should remove JavaScript protocols', () => {
      const result = sanitizeInput('javascript:alert("xss")')
      expect(result).toBe('alert("xss")')
    })

    it('should remove event handlers', () => {
      const result = sanitizeInput('onclick=alert("xss") Hello')
      expect(result).toBe('alert("xss") Hello')
    })

    it('should trim whitespace', () => {
      const result = sanitizeInput('  Hello World  ')
      expect(result).toBe('Hello World')
    })

    it('should limit length', () => {
      const longString = 'a'.repeat(2000)
      const result = sanitizeInput(longString)
      expect(result.length).toBe(1000)
    })

    it('should handle non-string input', () => {
      const result = sanitizeInput(null as any)
      expect(result).toBe('')
    })
  })

  describe('validateFileType', () => {
    it('should accept valid image files', () => {
      expect(validateFileType('image.jpg', 'image/jpeg')).toBe(true)
      expect(validateFileType('image.png', 'image/png')).toBe(true)
      expect(validateFileType('image.webp', 'image/webp')).toBe(true)
    })

    it('should reject invalid file types', () => {
      expect(validateFileType('script.js', 'application/javascript')).toBe(false)
      expect(validateFileType('document.doc', 'application/msword')).toBe(false)
    })

    it('should reject files with mismatched extensions', () => {
      expect(validateFileType('image.exe', 'image/jpeg')).toBe(false)
      expect(validateFileType('script.jpg', 'application/javascript')).toBe(false)
    })
  })

  describe('generateSecureToken', () => {
    it('should generate token of correct length', () => {
      const token = generateSecureToken(16)
      expect(token).toHaveLength(32) // hex encoding doubles length
    })

    it('should generate different tokens', () => {
      const token1 = generateSecureToken()
      const token2 = generateSecureToken()
      expect(token1).not.toBe(token2)
    })

    it('should generate hex string', () => {
      const token = generateSecureToken()
      expect(token).toMatch(/^[0-9a-f]+$/)
    })
  })

  describe('CSRF Token', () => {
    it('should generate CSRF token', () => {
      const token = generateCSRFToken()
      expect(token).toHaveLength(64)
      expect(token).toMatch(/^[0-9a-f]+$/)
    })

    it('should validate CSRF token', () => {
      const token = generateCSRFToken()
      expect(validateCSRFToken(token, token)).toBe(true)
      expect(validateCSRFToken(token, 'different')).toBe(false)
      expect(validateCSRFToken('short', 'short')).toBe(false)
    })
  })

  describe('IP Address Validation', () => {
    it('should validate IPv4 addresses', () => {
      expect(validateIPAddress('192.168.1.1')).toBe(true)
      expect(validateIPAddress('127.0.0.1')).toBe(true)
      expect(validateIPAddress('255.255.255.255')).toBe(true)
    })

    it('should reject invalid IPv4 addresses', () => {
      expect(validateIPAddress('256.1.1.1')).toBe(false)
      expect(validateIPAddress('192.168.1')).toBe(false)
      expect(validateIPAddress('not.an.ip.address')).toBe(false)
    })

    it('should identify trusted IPs', () => {
      expect(isTrustedIP('127.0.0.1')).toBe(true)
      expect(isTrustedIP('::1')).toBe(true)
      expect(isTrustedIP('192.168.1.1')).toBe(false)
    })
  })
})
