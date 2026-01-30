/**
 * PIN Security Tests
 *
 * Tests for PIN hashing, verification, and management
 */

import {
  isValidPinFormat,
  getPinStrength,
  generateSalt,
  hashPin,
  verifyPin,
  setupPin,
  changePin,
  checkLocalLockout,
  recordLocalPinAttempt,
  clearAttemptHistory,
} from '../pin'

// Mock crypto.getRandomValues for testing
global.crypto = {
  getRandomValues: (array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
    return array
  },
  subtle: {
    importKey: jest.fn(),
    deriveBits: jest.fn(),
  },
} as any

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// ============================================================================
// Tests
// ============================================================================

describe('PIN Validation', () => {
  describe('isValidPinFormat', () => {
    it('should accept 4-digit PINs', () => {
      expect(isValidPinFormat('1234')).toBe(true)
    })

    it('should accept 5-digit PINs', () => {
      expect(isValidPinFormat('12345')).toBe(true)
    })

    it('should accept 6-digit PINs', () => {
      expect(isValidPinFormat('123456')).toBe(true)
    })

    it('should reject PINs less than 4 digits', () => {
      expect(isValidPinFormat('123')).toBe(false)
    })

    it('should reject PINs more than 6 digits', () => {
      expect(isValidPinFormat('1234567')).toBe(false)
    })

    it('should reject non-numeric PINs', () => {
      expect(isValidPinFormat('abcd')).toBe(false)
      expect(isValidPinFormat('12a4')).toBe(false)
    })
  })

  describe('getPinStrength', () => {
    it('should mark sequential patterns as weak', () => {
      expect(getPinStrength('1234').strength).toBe('weak')
      expect(getPinStrength('4321').strength).toBe('weak')
    })

    it('should mark repeating digits as weak', () => {
      expect(getPinStrength('1111').strength).toBe('weak')
      expect(getPinStrength('0000').strength).toBe('weak')
    })

    it('should mark 5-digit PINs as medium', () => {
      expect(getPinStrength('13579').strength).toBe('medium')
    })

    it('should mark 6-digit PINs as strong', () => {
      expect(getPinStrength('135792').strength).toBe('strong')
    })
  })
})

describe('PIN Cryptography', () => {
  beforeEach(() => {
    // Setup crypto mocks
    const mockHash = new Uint8Array(32).fill(42)

    global.crypto.subtle.importKey = jest.fn().mockResolvedValue('mock-key')
    global.crypto.subtle.deriveBits = jest.fn().mockResolvedValue(mockHash.buffer)
  })

  describe('generateSalt', () => {
    it('should generate a salt', () => {
      const salt = generateSalt()
      expect(salt).toBeDefined()
      expect(typeof salt).toBe('string')
      expect(salt.length).toBeGreaterThan(0)
    })

    it('should generate unique salts', () => {
      const salt1 = generateSalt()
      const salt2 = generateSalt()
      expect(salt1).not.toBe(salt2)
    })
  })

  describe('hashPin', () => {
    it('should hash a PIN', async () => {
      const result = await hashPin('1234')
      expect(result).toHaveProperty('hash')
      expect(result).toHaveProperty('salt')
      expect(typeof result.hash).toBe('string')
      expect(typeof result.salt).toBe('string')
    })

    it('should use provided salt', async () => {
      const salt = 'test-salt-123'
      const result = await hashPin('1234', salt)
      expect(result.salt).toBe(salt)
    })

    it('should reject invalid PIN format', async () => {
      await expect(hashPin('abc')).rejects.toThrow('PIN must be 4-6 digits')
    })
  })

  describe('verifyPin', () => {
    it('should verify correct PIN', async () => {
      const { hash, salt } = await hashPin('1234')
      const isValid = await verifyPin('1234', hash, salt)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect PIN', async () => {
      const { hash, salt } = await hashPin('1234')
      const isValid = await verifyPin('5678', hash, salt)
      expect(isValid).toBe(false)
    })
  })
})

describe('PIN Setup', () => {
  beforeEach(() => {
    localStorage.clear()

    // Setup crypto mocks
    const mockHash = new Uint8Array(32).fill(42)
    global.crypto.subtle.importKey = jest.fn().mockResolvedValue('mock-key')
    global.crypto.subtle.deriveBits = jest.fn().mockResolvedValue(mockHash.buffer)
  })

  describe('setupPin', () => {
    it('should setup a PIN', async () => {
      const result = await setupPin('123456', '123456', {
        lockTimeoutMinutes: 15,
      })

      expect(result.success).toBe(true)
      expect(result.settings).toBeDefined()
      expect(result.settings?.lockTimeoutMinutes).toBe(15)
    })

    it('should reject mismatched PINs', async () => {
      const result = await setupPin('1234', '5678')
      expect(result.success).toBe(false)
      expect(result.error).toContain('do not match')
    })

    it('should reject weak PINs', async () => {
      const result = await setupPin('1234', '1234')
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should store PIN settings', async () => {
      await setupPin('135792', '135792')
      const stored = localStorage.getItem('nself_chat_pin_settings')
      expect(stored).toBeDefined()
    })
  })

  describe('changePin', () => {
    it('should change PIN with correct current PIN', async () => {
      // Setup initial PIN
      await setupPin('135792', '135792')

      // Change PIN
      const result = await changePin('135792', '246813', '246813')
      expect(result.success).toBe(true)
    })

    it('should reject incorrect current PIN', async () => {
      await setupPin('135792', '135792')
      const result = await changePin('000000', '246813', '246813')
      expect(result.success).toBe(false)
      expect(result.error).toContain('incorrect')
    })
  })
})

describe('Failed Attempt Lockout', () => {
  beforeEach(() => {
    localStorage.clear()
    clearAttemptHistory()
  })

  it('should not lock with fewer than 5 failed attempts', () => {
    recordLocalPinAttempt(false)
    recordLocalPinAttempt(false)
    recordLocalPinAttempt(false)

    const lockout = checkLocalLockout()
    expect(lockout.isLocked).toBe(false)
    expect(lockout.failedAttempts).toBe(3)
  })

  it('should lock after 5 failed attempts', () => {
    for (let i = 0; i < 5; i++) {
      recordLocalPinAttempt(false)
    }

    const lockout = checkLocalLockout()
    expect(lockout.isLocked).toBe(true)
    expect(lockout.remainingMinutes).toBeGreaterThan(0)
  })

  it('should clear attempt history', () => {
    recordLocalPinAttempt(false)
    recordLocalPinAttempt(false)

    let lockout = checkLocalLockout()
    expect(lockout.failedAttempts).toBe(2)

    clearAttemptHistory()

    lockout = checkLocalLockout()
    expect(lockout.failedAttempts).toBe(0)
  })

  it('should reset attempts after successful unlock', () => {
    for (let i = 0; i < 3; i++) {
      recordLocalPinAttempt(false)
    }

    recordLocalPinAttempt(true)

    const lockout = checkLocalLockout()
    expect(lockout.failedAttempts).toBe(3) // Still counts, but no lockout
  })
})

describe('LocalStorage Integration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should persist PIN settings to localStorage', async () => {
    const mockHash = new Uint8Array(32).fill(42)
    global.crypto.subtle.importKey = jest.fn().mockResolvedValue('mock-key')
    global.crypto.subtle.deriveBits = jest.fn().mockResolvedValue(mockHash.buffer)

    await setupPin('135792', '135792', {
      lockOnClose: true,
      lockTimeoutMinutes: 30,
    })

    const stored = localStorage.getItem('nself_chat_pin_settings')
    expect(stored).toBeDefined()

    const settings = JSON.parse(stored!)
    expect(settings.lockOnClose).toBe(true)
    expect(settings.lockTimeoutMinutes).toBe(30)
  })

  it('should persist attempt history to localStorage', () => {
    recordLocalPinAttempt(false, 'test_failure')

    const stored = localStorage.getItem('nself_chat_pin_attempts')
    expect(stored).toBeDefined()

    const attempts = JSON.parse(stored!)
    expect(attempts.length).toBe(1)
    expect(attempts[0].success).toBe(false)
    expect(attempts[0].failureReason).toBe('test_failure')
  })
})
