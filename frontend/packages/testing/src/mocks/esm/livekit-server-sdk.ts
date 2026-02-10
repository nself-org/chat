/**
 * LiveKit Server SDK Mock for Jest Tests
 *
 * Mocks the livekit-server-sdk package for testing WebRTC functionality.
 *
 * @module @nself-chat/testing/mocks/esm/livekit-server-sdk
 */

/**
 * Mock RoomServiceClient class
 */
export class RoomServiceClient {
  host: string
  apiKey: string
  apiSecret: string

  constructor(host: string, apiKey: string, apiSecret: string) {
    this.host = host
    this.apiKey = apiKey
    this.apiSecret = apiSecret
  }

  createRoom = jest.fn(async (opts: any) => ({
    sid: `room-${Date.now()}`,
    name: opts.name,
    emptyTimeout: opts.emptyTimeout || 300,
    maxParticipants: opts.maxParticipants || 50,
    creationTime: Date.now(),
    numParticipants: 0,
  }))

  listRooms = jest.fn(async () => [])

  deleteRoom = jest.fn(async (_room: string) => {})

  listParticipants = jest.fn(async (_room: string) => [])

  getParticipant = jest.fn(async (_room: string, identity: string) => ({
    sid: `participant-${identity}`,
    identity,
    state: 'ACTIVE',
    joinedAt: Date.now(),
  }))

  removeParticipant = jest.fn(async (_room: string, _identity: string) => {})

  mutePublishedTrack = jest.fn(async (_room: string, _identity: string, _trackSid: string) => {})

  updateParticipant = jest.fn(async (_room: string, _identity: string, _metadata: string) => ({}))

  updateRoomMetadata = jest.fn(async (_room: string, _metadata: string) => ({}))
}

/**
 * Mock AccessToken class
 */
export class AccessToken {
  apiKey: string
  apiSecret: string
  identity: string
  ttl: number
  metadata?: string

  constructor(apiKey: string, apiSecret: string, options?: any) {
    this.apiKey = apiKey
    this.apiSecret = apiSecret
    this.identity = options?.identity || ''
    this.ttl = options?.ttl || 3600
    this.metadata = options?.metadata
  }

  addGrant = jest.fn((grant: any) => {
    // Store grant for testing
    ;(this as any).grant = grant
  })

  toJwt = jest.fn(() => {
    return `mock-jwt-token-${this.identity}-${Date.now()}`
  })
}

/**
 * Mock VideoGrant class
 */
export class VideoGrant {
  roomJoin?: boolean
  room?: string
  canPublish?: boolean
  canSubscribe?: boolean
  canPublishData?: boolean
  hidden?: boolean
  recorder?: boolean

  constructor(options?: any) {
    Object.assign(this, options)
  }
}

/**
 * Mock EgressClient class
 */
export class EgressClient {
  host: string
  apiKey: string
  apiSecret: string

  constructor(host: string, apiKey: string, apiSecret: string) {
    this.host = host
    this.apiKey = apiKey
    this.apiSecret = apiSecret
  }

  startRoomCompositeEgress = jest.fn(async (_room: string, _opts: any) => ({
    egressId: `egress-${Date.now()}`,
    status: 'EGRESS_STARTING',
  }))

  stopEgress = jest.fn(async (_egressId: string) => ({
    egressId: _egressId,
    status: 'EGRESS_ENDING',
  }))

  listEgress = jest.fn(async () => [])
}

/**
 * Mock TrackInfo class
 */
export class TrackInfo {
  sid: string
  type: string
  name: string
  muted: boolean
  width?: number
  height?: number

  constructor(data: any) {
    this.sid = data.sid
    this.type = data.type
    this.name = data.name
    this.muted = data.muted || false
    this.width = data.width
    this.height = data.height
  }
}

/**
 * Mock Room enum
 */
export enum Room {
  VIDEO_QUALITY_LOW = 0,
  VIDEO_QUALITY_MEDIUM = 1,
  VIDEO_QUALITY_HIGH = 2,
}

export default {
  RoomServiceClient,
  AccessToken,
  VideoGrant,
  EgressClient,
  TrackInfo,
  Room,
}
