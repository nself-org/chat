/**
 * Cryptographic Operations Tests
 * Tests for core crypto functions used in E2EE
 */

import { describe, it, expect } from '@jest/globals'
import { crypto } from '../crypto'

describe('Cryptographic Operations', () => {
  describe('Key Derivation', () => {
    it('derives consistent master key from password', async () => {
      const password = 'test-password-123'
      const salt = crypto.generateSalt()

      const key1 = await crypto.deriveMasterKey(password, salt)
      const key2 = await crypto.deriveMasterKey(password, salt)

      expect(key1).toEqual(key2)
      expect(key1.length).toBe(32) // 256 bits
    })

    it('produces different keys with different salts', async () => {
      const password = 'test-password-123'
      const salt1 = crypto.generateSalt()
      const salt2 = crypto.generateSalt()

      const key1 = await crypto.deriveMasterKey(password, salt1)
      const key2 = await crypto.deriveMasterKey(password, salt2)

      expect(key1).not.toEqual(key2)
    })

    it('uses correct number of PBKDF2 iterations', async () => {
      const password = 'test-password-123'
      const salt = crypto.generateSalt()

      const start = performance.now()
      await crypto.deriveMasterKey(password, salt)
      const duration = performance.now() - start

      // Should take at least 50ms with 100k iterations
      expect(duration).toBeGreaterThan(50)
    }, 10000) // Increase timeout for slow CI

    it('produces different keys with different passwords', async () => {
      const salt = crypto.generateSalt()

      const key1 = await crypto.deriveMasterKey('password1', salt)
      const key2 = await crypto.deriveMasterKey('password2', salt)

      expect(key1).not.toEqual(key2)
    })
  })

  describe('Symmetric Encryption', () => {
    it('encrypts and decrypts correctly', async () => {
      const key = crypto.generateRandomBytes(32)
      const plaintext = new Uint8Array([1, 2, 3, 4, 5])

      const { ciphertext, iv } = await crypto.encryptAESGCM(plaintext, key)
      const decrypted = await crypto.decryptAESGCM(ciphertext, key, iv)

      expect(decrypted).toEqual(plaintext)
    })

    it('produces different ciphertext with same plaintext', async () => {
      const key = crypto.generateRandomBytes(32)
      const plaintext = new Uint8Array([1, 2, 3, 4, 5])

      const { ciphertext: ct1 } = await crypto.encryptAESGCM(plaintext, key)
      const { ciphertext: ct2 } = await crypto.encryptAESGCM(plaintext, key)

      expect(ct1).not.toEqual(ct2) // Different IVs
    })

    it('fails to decrypt with wrong key', async () => {
      const key1 = crypto.generateRandomBytes(32)
      const key2 = crypto.generateRandomBytes(32)
      const plaintext = new Uint8Array([1, 2, 3, 4, 5])

      const { ciphertext, iv } = await crypto.encryptAESGCM(plaintext, key1)

      await expect(crypto.decryptAESGCM(ciphertext, key2, iv)).rejects.toThrow()
    })

    it('fails to decrypt with tampered ciphertext', async () => {
      const key = crypto.generateRandomBytes(32)
      const plaintext = new Uint8Array([1, 2, 3, 4, 5])

      const { ciphertext, iv } = await crypto.encryptAESGCM(plaintext, key)

      // Tamper with ciphertext
      const tamperedCiphertext = new Uint8Array(ciphertext)
      tamperedCiphertext[0] ^= 0xff

      await expect(crypto.decryptAESGCM(tamperedCiphertext, key, iv)).rejects.toThrow()
    })

    it('handles empty plaintext', async () => {
      const key = crypto.generateRandomBytes(32)
      const plaintext = new Uint8Array(0)

      const { ciphertext, iv } = await crypto.encryptAESGCM(plaintext, key)
      const decrypted = await crypto.decryptAESGCM(ciphertext, key, iv)

      expect(decrypted.length).toBe(0)
    })

    it('handles large plaintext', async () => {
      const key = crypto.generateRandomBytes(32)
      const plaintext = crypto.generateRandomBytes(1024 * 1024) // 1 MB

      const { ciphertext, iv } = await crypto.encryptAESGCM(plaintext, key)
      const decrypted = await crypto.decryptAESGCM(ciphertext, key, iv)

      expect(decrypted).toEqual(plaintext)
    }, 10000) // Increase timeout
  })

  describe('Safety Number Generation', () => {
    it('generates 60-digit safety number', () => {
      const localKey = crypto.generateRandomBytes(32)
      const remoteKey = crypto.generateRandomBytes(32)

      const safetyNumber = crypto.generateSafetyNumber(localKey, 'user-1', remoteKey, 'user-2')

      // Remove spaces and check length
      const digits = safetyNumber.replace(/\s/g, '')
      expect(digits).toHaveLength(60)
      expect(digits).toMatch(/^\d+$/)
    })

    it('produces same number regardless of order', () => {
      const key1 = crypto.generateRandomBytes(32)
      const key2 = crypto.generateRandomBytes(32)

      const sn1 = crypto.generateSafetyNumber(key1, 'user-a', key2, 'user-b')
      const sn2 = crypto.generateSafetyNumber(key2, 'user-b', key1, 'user-a')

      expect(sn1).toEqual(sn2)
    })

    it('produces different numbers for different keys', () => {
      const key1 = crypto.generateRandomBytes(32)
      const key2 = crypto.generateRandomBytes(32)
      const key3 = crypto.generateRandomBytes(32)

      const sn1 = crypto.generateSafetyNumber(key1, 'user-a', key2, 'user-b')
      const sn2 = crypto.generateSafetyNumber(key1, 'user-a', key3, 'user-b')

      expect(sn1).not.toEqual(sn2)
    })

    it('produces different numbers for different user IDs', () => {
      const key1 = crypto.generateRandomBytes(32)
      const key2 = crypto.generateRandomBytes(32)

      const sn1 = crypto.generateSafetyNumber(key1, 'user-1', key2, 'user-2')
      const sn2 = crypto.generateSafetyNumber(key1, 'user-1', key2, 'user-3')

      expect(sn1).not.toEqual(sn2)
    })

    it('formats safety number correctly', () => {
      const localKey = crypto.generateRandomBytes(32)
      const remoteKey = crypto.generateRandomBytes(32)

      const safetyNumber = crypto.generateSafetyNumber(localKey, 'user-1', remoteKey, 'user-2')

      // Should be formatted as groups of 5 digits
      const formatted = crypto.formatSafetyNumber(safetyNumber)
      const groups = formatted.split(' ')

      expect(groups.length).toBe(12) // 60 digits / 5 = 12 groups
      groups.forEach((group) => {
        expect(group).toHaveLength(5)
        expect(group).toMatch(/^\d{5}$/)
      })
    })
  })

  describe('Random Generation', () => {
    it('generates random bytes of correct length', () => {
      const bytes = crypto.generateRandomBytes(32)
      expect(bytes.length).toBe(32)
    })

    it('generates different random bytes each time', () => {
      const bytes1 = crypto.generateRandomBytes(32)
      const bytes2 = crypto.generateRandomBytes(32)

      expect(bytes1).not.toEqual(bytes2)
    })

    it('generates valid device IDs', () => {
      const deviceId = crypto.generateDeviceId()

      expect(deviceId).toMatch(/^[0-9a-f]{32}$/) // 16 bytes = 32 hex chars
    })

    it('generates different device IDs', () => {
      const id1 = crypto.generateDeviceId()
      const id2 = crypto.generateDeviceId()

      expect(id1).not.toEqual(id2)
    })

    it('generates valid registration IDs', () => {
      const regId = crypto.generateRegistrationId()

      expect(regId).toBeGreaterThanOrEqual(0)
      expect(regId).toBeLessThan(16384) // 14-bit number
    })
  })

  describe('Hashing', () => {
    it('generates consistent SHA-256 hashes', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5])

      const hash1 = crypto.hash256(data)
      const hash2 = crypto.hash256(data)

      expect(hash1).toEqual(hash2)
      expect(hash1.length).toBe(32) // 256 bits
    })

    it('produces different hashes for different data', () => {
      const data1 = new Uint8Array([1, 2, 3, 4, 5])
      const data2 = new Uint8Array([5, 4, 3, 2, 1])

      const hash1 = crypto.hash256(data1)
      const hash2 = crypto.hash256(data2)

      expect(hash1).not.toEqual(hash2)
    })

    it('generates consistent fingerprints', () => {
      const publicKey = crypto.generateRandomBytes(32)

      const fp1 = crypto.generateFingerprint(publicKey)
      const fp2 = crypto.generateFingerprint(publicKey)

      expect(fp1).toEqual(fp2)
      expect(fp1).toMatch(/^[0-9a-f]{64}$/) // 32 bytes = 64 hex chars
    })
  })

  describe('String Conversion', () => {
    it('converts bytes to string and back', () => {
      const original = 'Hello, World! 🌍'
      const bytes = crypto.stringToBytes(original)
      const restored = crypto.bytesToString(bytes)

      expect(restored).toEqual(original)
    })

    it('handles unicode correctly', () => {
      const unicode = '你好世界 مرحبا بالعالم Привет мир'
      const bytes = crypto.stringToBytes(unicode)
      const restored = crypto.bytesToString(bytes)

      expect(restored).toEqual(unicode)
    })

    it('handles empty strings', () => {
      const bytes = crypto.stringToBytes('')
      expect(bytes.length).toBe(0)

      const restored = crypto.bytesToString(bytes)
      expect(restored).toEqual('')
    })
  })

  describe('Recovery Code', () => {
    it('generates 12-word recovery code', () => {
      const recoveryCode = crypto.generateRecoveryCode()
      const words = recoveryCode.split(' ')

      expect(words.length).toBe(12)
      words.forEach((word) => {
        expect(word).toMatch(/^[a-z]+$/) // All lowercase
      })
    })

    it('generates different recovery codes', () => {
      const code1 = crypto.generateRecoveryCode()
      const code2 = crypto.generateRecoveryCode()

      expect(code1).not.toEqual(code2)
    })

    it('derives consistent key from recovery code', async () => {
      const recoveryCode = crypto.generateRecoveryCode()
      const salt = crypto.generateSalt()

      const key1 = await crypto.deriveRecoveryKey(recoveryCode, salt)
      const key2 = await crypto.deriveRecoveryKey(recoveryCode, salt)

      expect(key1).toEqual(key2)
      expect(key1.length).toBe(32)
    })
  })
})
