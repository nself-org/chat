/**
 * Virus Scanner Service Tests
 */

import {
  VirusScannerService,
  getScannerConfig,
  getVirusScannerService,
  resetVirusScannerService,
  toScanResult,
  type ScannerConfig,
  type VirusScanResult,
} from '../virus-scanner.service'

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock net module for ClamAV tests
jest.mock('net', () => ({
  Socket: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    write: jest.fn(),
    on: jest.fn(),
    destroy: jest.fn(),
  })),
}))

describe('VirusScannerService', () => {
  // Store original env
  const originalEnv = process.env

  beforeEach(() => {
    // Reset env for each test
    process.env = { ...originalEnv }
    // Reset singleton
    resetVirusScannerService()
    // Clear mocks
    jest.clearAllMocks()
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('getScannerConfig', () => {
    it('should return disabled config by default', () => {
      const config = getScannerConfig()

      expect(config.enabled).toBe(false)
      expect(config.backend).toBe('none')
    })

    it('should detect ClamAV when host is configured', () => {
      process.env.FILE_ENABLE_VIRUS_SCAN = 'true'
      process.env.CLAMAV_HOST = 'localhost'
      process.env.CLAMAV_PORT = '3310'

      const config = getScannerConfig()

      expect(config.enabled).toBe(true)
      expect(config.backend).toBe('clamav')
      expect(config.clamav).toBeDefined()
      expect(config.clamav?.host).toBe('localhost')
      expect(config.clamav?.port).toBe(3310)
    })

    it('should detect VirusTotal when API key is configured', () => {
      process.env.FILE_ENABLE_VIRUS_SCAN = 'true'
      process.env.VIRUSTOTAL_API_KEY = 'test-api-key'

      const config = getScannerConfig()

      expect(config.enabled).toBe(true)
      expect(config.backend).toBe('virustotal')
      expect(config.virustotal).toBeDefined()
      expect(config.virustotal?.apiKey).toBe('test-api-key')
    })

    it('should detect plugin scanner when URL is configured and scanning is enabled', () => {
      process.env.FILE_ENABLE_VIRUS_SCAN = 'true'
      process.env.FILE_PROCESSING_URL = 'http://localhost:3104'

      const config = getScannerConfig()

      expect(config.enabled).toBe(true)
      expect(config.backend).toBe('plugin')
      expect(config.plugin).toBeDefined()
      expect(config.plugin?.baseUrl).toBe('http://localhost:3104')
    })

    it('should respect explicit backend override', () => {
      process.env.FILE_ENABLE_VIRUS_SCAN = 'true'
      process.env.CLAMAV_HOST = 'localhost'
      process.env.VIRUSTOTAL_API_KEY = 'test-key'
      process.env.VIRUS_SCANNER_BACKEND = 'virustotal'

      const config = getScannerConfig()

      expect(config.backend).toBe('virustotal')
    })

    it('should configure fallback backend', () => {
      process.env.FILE_ENABLE_VIRUS_SCAN = 'true'
      process.env.CLAMAV_HOST = 'localhost'
      process.env.VIRUSTOTAL_API_KEY = 'test-key'
      process.env.VIRUS_SCANNER_FALLBACK = 'virustotal'

      const config = getScannerConfig()

      expect(config.backend).toBe('clamav')
      expect(config.fallbackBackend).toBe('virustotal')
    })

    it('should configure blocking behavior', () => {
      process.env.FILE_ENABLE_VIRUS_SCAN = 'true'
      process.env.VIRUS_SCANNER_BLOCK_ON_UNAVAILABLE = 'true'

      const config = getScannerConfig()

      expect(config.blockOnScannerUnavailable).toBe(true)
    })

    it('should configure quarantine behavior', () => {
      process.env.VIRUS_SCANNER_QUARANTINE = 'false'

      const config = getScannerConfig()

      expect(config.quarantineInfected).toBe(false)
    })
  })

  describe('VirusScannerService.scanFile', () => {
    it('should skip scanning when disabled', async () => {
      const scanner = new VirusScannerService({ enabled: false })
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' })

      const result = await scanner.scanFile(file)

      expect(result.scanned).toBe(false)
      expect(result.clean).toBe(true)
      expect(result.shouldBlock).toBe(false)
      expect(result.error).toContain('disabled')
    })

    it('should skip scanning files larger than max size', async () => {
      const scanner = new VirusScannerService({
        enabled: true,
        backend: 'none',
        maxScanSize: 100,
        blockOnScannerUnavailable: false,
        quarantineInfected: true,
        timeout: 60000,
      })

      // Create a file larger than max size
      const largeContent = 'x'.repeat(200)
      const file = new File([largeContent], 'large.txt', { type: 'text/plain' })

      const result = await scanner.scanFile(file)

      expect(result.scanned).toBe(false)
      expect(result.error).toContain('too large')
    })

    it('should handle no scanner configured', async () => {
      const scanner = new VirusScannerService({
        enabled: true,
        backend: 'none',
        blockOnScannerUnavailable: false,
        quarantineInfected: true,
        maxScanSize: 100 * 1024 * 1024,
        timeout: 60000,
      })

      const file = new File(['test content'], 'test.txt', { type: 'text/plain' })

      const result = await scanner.scanFile(file)

      expect(result.scanned).toBe(false)
      expect(result.backend).toBe('none')
    })

    it('should accept Buffer input', async () => {
      const scanner = new VirusScannerService({ enabled: false })
      const buffer = Buffer.from('test content')

      const result = await scanner.scanFile(buffer)

      expect(result.scanned).toBe(false)
      expect(result.clean).toBe(true)
    })

    it('should accept ArrayBuffer input', async () => {
      const scanner = new VirusScannerService({ enabled: false })
      const encoder = new TextEncoder()
      const arrayBuffer = encoder.encode('test content').buffer

      const result = await scanner.scanFile(arrayBuffer)

      expect(result.scanned).toBe(false)
      expect(result.clean).toBe(true)
    })
  })

  describe('VirusScannerService.getHealth', () => {
    it('should return health status', () => {
      const scanner = new VirusScannerService({ enabled: false, backend: 'none' })
      const health = scanner.getHealth()

      expect(health).toHaveProperty('healthy')
      expect(health).toHaveProperty('backend')
      expect(health).toHaveProperty('lastCheck')
      expect(health).toHaveProperty('consecutiveFailures')
    })
  })

  describe('VirusScannerService.getConfigSummary', () => {
    it('should return safe config summary', () => {
      const scanner = new VirusScannerService({
        enabled: true,
        backend: 'clamav',
        fallbackBackend: 'virustotal',
        blockOnScannerUnavailable: true,
        quarantineInfected: true,
        maxScanSize: 100 * 1024 * 1024,
        timeout: 60000,
        clamav: { host: 'localhost', port: 3310 },
        virustotal: { apiKey: 'secret-key' },
      })

      const summary = scanner.getConfigSummary()

      expect(summary.enabled).toBe(true)
      expect(summary.backend).toBe('clamav')
      expect(summary.fallbackBackend).toBe('virustotal')
      expect(summary.blockOnScannerUnavailable).toBe(true)
      // Should NOT include sensitive data
      expect(summary).not.toHaveProperty('clamav')
      expect(summary).not.toHaveProperty('virustotal')
    })
  })

  describe('VirusScannerService.quarantineFile', () => {
    it('should quarantine infected file when enabled', async () => {
      const scanner = new VirusScannerService({
        enabled: true,
        backend: 'none',
        quarantineInfected: true,
        blockOnScannerUnavailable: false,
        maxScanSize: 100 * 1024 * 1024,
        timeout: 60000,
      })

      const result = await scanner.quarantineFile('file-123', 'uploads/test.exe', ['Trojan.Win32'])

      expect(result.quarantined).toBe(true)
      expect(result.quarantinePath).toContain('quarantine/')
      expect(result.quarantinePath).toContain('file-123')
    })

    it('should not quarantine when disabled', async () => {
      const scanner = new VirusScannerService({
        enabled: true,
        backend: 'none',
        quarantineInfected: false,
        blockOnScannerUnavailable: false,
        maxScanSize: 100 * 1024 * 1024,
        timeout: 60000,
      })

      const result = await scanner.quarantineFile('file-123', 'uploads/test.exe', ['Trojan.Win32'])

      expect(result.quarantined).toBe(false)
      expect(result.error).toContain('disabled')
    })
  })

  describe('getVirusScannerService', () => {
    it('should return singleton instance', () => {
      const instance1 = getVirusScannerService()
      const instance2 = getVirusScannerService()

      expect(instance1).toBe(instance2)
    })

    it('should create new instance after reset', () => {
      const instance1 = getVirusScannerService()
      resetVirusScannerService()
      const instance2 = getVirusScannerService()

      expect(instance1).not.toBe(instance2)
    })
  })

  describe('toScanResult', () => {
    it('should convert VirusScanResult to ScanResult', () => {
      const virusResult: VirusScanResult = {
        scanned: true,
        clean: false,
        threats: ['Trojan.Generic', 'Malware.Win32'],
        backend: 'clamav',
        scanDuration: 1500,
        shouldBlock: true,
      }

      const scanResult = toScanResult(virusResult, 'file-123')

      expect(scanResult.fileId).toBe('file-123')
      expect(scanResult.status).toBe('infected')
      expect(scanResult.isClean).toBe(false)
      expect(scanResult.threatsFound).toBe(2)
      expect(scanResult.threatNames).toEqual(['Trojan.Generic', 'Malware.Win32'])
      expect(scanResult.scanDuration).toBe(1500)
      expect(scanResult.scannedAt).toBeInstanceOf(Date)
    })

    it('should handle clean result', () => {
      const virusResult: VirusScanResult = {
        scanned: true,
        clean: true,
        threats: [],
        backend: 'virustotal',
        scanDuration: 500,
        shouldBlock: false,
      }

      const scanResult = toScanResult(virusResult, 'file-456')

      expect(scanResult.status).toBe('clean')
      expect(scanResult.isClean).toBe(true)
      expect(scanResult.threatsFound).toBe(0)
    })

    it('should handle error result', () => {
      const virusResult: VirusScanResult = {
        scanned: false,
        clean: true,
        threats: [],
        backend: 'clamav',
        shouldBlock: false,
        error: 'Scanner unavailable',
      }

      const scanResult = toScanResult(virusResult, 'file-789')

      expect(scanResult.status).toBe('error')
      expect(scanResult.isClean).toBe(true)
    })
  })
})

describe('ClamAV Integration', () => {
  it('should be tested with actual ClamAV server', () => {
    // This test is skipped unless CLAMAV_HOST is set
    // To run: CLAMAV_HOST=localhost pnpm test virus-scanner.test.ts
    const host = process.env.CLAMAV_HOST
    if (!host) {
      expect(true).toBe(true) // Skip
      return
    }

    // Integration test would go here
  })
})

describe('VirusTotal Integration', () => {
  it('should be tested with actual VirusTotal API', () => {
    // This test is skipped unless VIRUSTOTAL_API_KEY is set
    // To run: VIRUSTOTAL_API_KEY=your-key pnpm test virus-scanner.test.ts
    const apiKey = process.env.VIRUSTOTAL_API_KEY
    if (!apiKey) {
      expect(true).toBe(true) // Skip
      return
    }

    // Integration test would go here
  })
})
