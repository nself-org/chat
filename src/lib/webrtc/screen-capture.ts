/**
 * Screen Capture Manager
 *
 * Handles screen, window, and tab capture using getDisplayMedia API.
 * Supports system audio capture, quality controls, and multiple streams.
 */

// =============================================================================
// Types
// =============================================================================

export type ScreenCaptureType = 'screen' | 'window' | 'tab'

export type ScreenCaptureQuality = 'auto' | '720p' | '1080p' | '4k'

export interface ScreenCaptureConstraints {
  video: {
    displaySurface?: ScreenCaptureType
    width?: { ideal: number; max?: number }
    height?: { ideal: number; max?: number }
    frameRate?: { ideal: number; max?: number }
    cursor?: 'always' | 'motion' | 'never'
    logicalSurface?: boolean
  }
  audio:
    | boolean
    | {
        echoCancellation?: boolean
        noiseSuppression?: boolean
        sampleRate?: number
        channelCount?: number
        autoGainControl?: boolean
        suppressLocalAudioPlayback?: boolean
      }
  preferCurrentTab?: boolean
  selfBrowserSurface?: 'include' | 'exclude'
  surfaceSwitching?: 'include' | 'exclude'
  systemAudio?: 'include' | 'exclude'
}

export interface ScreenCaptureOptions {
  type?: ScreenCaptureType
  quality?: ScreenCaptureQuality
  frameRate?: number
  captureSystemAudio?: boolean
  captureCursor?: boolean
  preferCurrentTab?: boolean
  allowSurfaceSwitching?: boolean
}

export interface ScreenShare {
  id: string
  stream: MediaStream
  type: ScreenCaptureType
  userId: string
  userName: string
  startedAt: Date
  hasAudio: boolean
  videoTrack: MediaStreamTrack
  audioTrack?: MediaStreamTrack
}

export interface ScreenCaptureCallbacks {
  onStreamStarted?: (stream: MediaStream) => void
  onStreamEnded?: (streamId: string) => void
  onError?: (error: Error) => void
  onTrackEnded?: (kind: 'video' | 'audio') => void
}

// =============================================================================
// Quality Presets
// =============================================================================

const QUALITY_PRESETS: Record<
  ScreenCaptureQuality,
  { width: number; height: number; frameRate: number }
> = {
  auto: { width: 1920, height: 1080, frameRate: 30 },
  '720p': { width: 1280, height: 720, frameRate: 30 },
  '1080p': { width: 1920, height: 1080, frameRate: 30 },
  '4k': { width: 3840, height: 2160, frameRate: 60 },
}

// =============================================================================
// Screen Capture Manager
// =============================================================================

export class ScreenCaptureManager {
  private streams: Map<string, ScreenShare> = new Map()
  private callbacks: ScreenCaptureCallbacks
  private streamCounter = 0

  constructor(callbacks: ScreenCaptureCallbacks = {}) {
    this.callbacks = callbacks
  }

  /**
   * Check if screen capture is supported
   */
  static isSupported(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      'mediaDevices' in navigator &&
      'getDisplayMedia' in navigator.mediaDevices
    )
  }

  /**
   * Build constraints from options
   */
  private buildConstraints(options: ScreenCaptureOptions = {}): ScreenCaptureConstraints {
    const {
      type,
      quality = 'auto',
      frameRate,
      captureSystemAudio = false,
      captureCursor = true,
      preferCurrentTab = false,
      allowSurfaceSwitching = true,
    } = options

    const preset = QUALITY_PRESETS[quality]

    const constraints: ScreenCaptureConstraints = {
      video: {
        width: { ideal: preset.width, max: preset.width * 1.5 },
        height: { ideal: preset.height, max: preset.height * 1.5 },
        frameRate: { ideal: frameRate ?? preset.frameRate, max: 60 },
        cursor: captureCursor ? 'always' : 'never',
        logicalSurface: true,
      },
      audio: false,
      preferCurrentTab,
      selfBrowserSurface: 'exclude',
      surfaceSwitching: allowSurfaceSwitching ? 'include' : 'exclude',
      systemAudio: captureSystemAudio ? 'include' : 'exclude',
    }

    // Add type preference if specified
    if (type) {
      constraints.video.displaySurface = type
    }

    // Enable audio capture if requested
    if (captureSystemAudio) {
      constraints.audio = {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        suppressLocalAudioPlayback: false,
      }
    }

    return constraints
  }

  /**
   * Start screen capture
   */
  async startCapture(
    userId: string,
    userName: string,
    options: ScreenCaptureOptions = {}
  ): Promise<ScreenShare> {
    if (!ScreenCaptureManager.isSupported()) {
      const error = new Error('Screen capture is not supported in this browser')
      this.callbacks.onError?.(error)
      throw error
    }

    try {
      const constraints = this.buildConstraints(options)

      // Request display media
      const stream = await navigator.mediaDevices.getDisplayMedia(constraints as MediaStreamConstraints)

      // Generate unique ID
      const id = `screen-${++this.streamCounter}-${Date.now()}`

      // Get tracks
      const videoTrack = stream.getVideoTracks()[0]
      const audioTrack = stream.getAudioTracks()[0]

      if (!videoTrack) {
        throw new Error('No video track in screen share stream')
      }

      // Detect capture type from settings
      const settings = videoTrack.getSettings()
      const type = (settings.displaySurface as ScreenCaptureType) || 'screen'

      // Create screen share object
      const screenShare: ScreenShare = {
        id,
        stream,
        type,
        userId,
        userName,
        startedAt: new Date(),
        hasAudio: !!audioTrack,
        videoTrack,
        audioTrack,
      }

      // Store screen share
      this.streams.set(id, screenShare)

      // Listen for track ended events
      videoTrack.addEventListener('ended', () => {
        this.handleTrackEnded(id, 'video')
      })

      if (audioTrack) {
        audioTrack.addEventListener('ended', () => {
          this.handleTrackEnded(id, 'audio')
        })
      }

      // Notify callback
      this.callbacks.onStreamStarted?.(stream)

      return screenShare
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to start screen capture')
      this.callbacks.onError?.(err)
      throw err
    }
  }

  /**
   * Stop a specific screen share
   */
  stopCapture(shareId: string): void {
    const share = this.streams.get(shareId)
    if (!share) return

    // Stop all tracks
    share.stream.getTracks().forEach((track) => track.stop())

    // Remove from map
    this.streams.delete(shareId)

    // Notify callback
    this.callbacks.onStreamEnded?.(shareId)
  }

  /**
   * Stop all screen shares
   */
  stopAllCaptures(): void {
    this.streams.forEach((_, id) => this.stopCapture(id))
  }

  /**
   * Get active screen share
   */
  getScreenShare(shareId: string): ScreenShare | undefined {
    return this.streams.get(shareId)
  }

  /**
   * Get all active screen shares
   */
  getAllScreenShares(): ScreenShare[] {
    return Array.from(this.streams.values())
  }

  /**
   * Update capture quality dynamically
   */
  async updateQuality(
    shareId: string,
    quality: ScreenCaptureQuality,
    frameRate?: number
  ): Promise<void> {
    const share = this.streams.get(shareId)
    if (!share) return

    const preset = QUALITY_PRESETS[quality]

    try {
      await share.videoTrack.applyConstraints({
        width: { ideal: preset.width, max: preset.width * 1.5 },
        height: { ideal: preset.height, max: preset.height * 1.5 },
        frameRate: { ideal: frameRate ?? preset.frameRate, max: 60 },
      })
    } catch (error) {
      this.callbacks.onError?.(
        error instanceof Error ? error : new Error('Failed to update quality')
      )
    }
  }

  /**
   * Update frame rate dynamically
   */
  async updateFrameRate(shareId: string, frameRate: number): Promise<void> {
    const share = this.streams.get(shareId)
    if (!share) return

    try {
      await share.videoTrack.applyConstraints({
        frameRate: { ideal: frameRate, max: 60 },
      })
    } catch (error) {
      this.callbacks.onError?.(
        error instanceof Error ? error : new Error('Failed to update frame rate')
      )
    }
  }

  /**
   * Get current video settings
   */
  getVideoSettings(shareId: string): MediaTrackSettings | null {
    const share = this.streams.get(shareId)
    if (!share) return null

    return share.videoTrack.getSettings()
  }

  /**
   * Check if a screen share is active
   */
  isActive(shareId: string): boolean {
    const share = this.streams.get(shareId)
    if (!share) return false

    return share.videoTrack.readyState === 'live'
  }

  /**
   * Get active screen share count
   */
  getActiveCount(): number {
    return this.streams.size
  }

  /**
   * Handle track ended event
   */
  private handleTrackEnded(shareId: string, kind: 'video' | 'audio'): void {
    this.callbacks.onTrackEnded?.(kind)

    // If video track ended, stop the entire share
    if (kind === 'video') {
      this.stopCapture(shareId)
    }
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.stopAllCaptures()
    this.streams.clear()
    this.streamCounter = 0
  }
}

// =============================================================================
// Factory Function
// =============================================================================

export function createScreenCaptureManager(
  callbacks: ScreenCaptureCallbacks = {}
): ScreenCaptureManager {
  return new ScreenCaptureManager(callbacks)
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Check browser support for system audio capture
 */
export function supportsSystemAudio(): boolean {
  // Chrome/Edge support system audio
  const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
  const isEdge = /Edg/.test(navigator.userAgent)

  return isChrome || isEdge
}

/**
 * Get optimal quality based on network conditions
 */
export function getOptimalQuality(
  downlinkMbps: number = 10
): ScreenCaptureQuality {
  if (downlinkMbps >= 20) return '4k'
  if (downlinkMbps >= 10) return '1080p'
  if (downlinkMbps >= 5) return '720p'
  return 'auto'
}

/**
 * Calculate bitrate for quality
 */
export function getBitrateForQuality(quality: ScreenCaptureQuality): number {
  const bitrates: Record<ScreenCaptureQuality, number> = {
    auto: 2500, // 2.5 Mbps
    '720p': 1500, // 1.5 Mbps
    '1080p': 2500, // 2.5 Mbps
    '4k': 8000, // 8 Mbps
  }

  return bitrates[quality]
}
