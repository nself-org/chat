/**
 * Signal Protocol Client Wrapper
 * Wraps @signalapp/libsignal-client for E2EE messaging
 */

import * as SignalClient from '@signalapp/libsignal-client';
import { crypto } from './crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface PreKeyBundle {
  registrationId: number;
  deviceId: string;
  identityKey: Uint8Array;
  signedPreKey: {
    keyId: number;
    publicKey: Uint8Array;
    signature: Uint8Array;
  };
  oneTimePreKey?: {
    keyId: number;
    publicKey: Uint8Array;
  };
}

export interface IdentityKeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface SignedPreKeyPair {
  keyId: number;
  keyPair: {
    publicKey: Uint8Array;
    privateKey: Uint8Array;
  };
  signature: Uint8Array;
}

export interface PreKeyPair {
  keyId: number;
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface SessionState {
  sessionState: Uint8Array;
  localRegistrationId: number;
  remoteRegistrationId: number;
}

export interface EncryptedMessage {
  type: 'PreKey' | 'Normal';
  body: Uint8Array;
  registrationId: number;
}

// ============================================================================
// IDENTITY KEY OPERATIONS
// ============================================================================

/**
 * Generate a new identity key pair
 */
export async function generateIdentityKeyPair(): Promise<IdentityKeyPair> {
  const keyPair = SignalClient.IdentityKeyPair.generate();

  return {
    publicKey: keyPair.publicKey.serialize(),
    privateKey: keyPair.privateKey.serialize(),
  };
}

/**
 * Get public identity key from key pair
 */
export function getPublicIdentityKey(
  identityKeyPair: IdentityKeyPair
): Uint8Array {
  return identityKeyPair.publicKey;
}

// ============================================================================
// SIGNED PREKEY OPERATIONS
// ============================================================================

/**
 * Generate a signed prekey
 */
export async function generateSignedPreKey(
  identityKeyPair: IdentityKeyPair,
  signedPreKeyId: number
): Promise<SignedPreKeyPair> {
  const identityPrivateKey = SignalClient.PrivateKey.deserialize(
    identityKeyPair.privateKey
  );

  const keyPair = SignalClient.PrivateKey.generate();
  const publicKey = keyPair.getPublicKey();

  // Sign the public key with identity key
  const signature = identityPrivateKey.sign(publicKey.serialize());

  return {
    keyId: signedPreKeyId,
    keyPair: {
      publicKey: publicKey.serialize(),
      privateKey: keyPair.serialize(),
    },
    signature,
  };
}

// ============================================================================
// ONE-TIME PREKEY OPERATIONS
// ============================================================================

/**
 * Generate multiple one-time prekeys
 */
export async function generateOneTimePreKeys(
  startId: number,
  count: number
): Promise<PreKeyPair[]> {
  const preKeys: PreKeyPair[] = [];

  for (let i = 0; i < count; i++) {
    const keyId = startId + i;
    const privateKey = SignalClient.PrivateKey.generate();
    const publicKey = privateKey.getPublicKey();

    preKeys.push({
      keyId,
      publicKey: publicKey.serialize(),
      privateKey: privateKey.serialize(),
    });
  }

  return preKeys;
}

// ============================================================================
// SESSION OPERATIONS
// ============================================================================

/**
 * Process a prekey bundle and create a session (X3DH initiator side)
 */
export async function processPreKeyBundle(
  bundle: PreKeyBundle,
  localIdentityKeyPair: IdentityKeyPair,
  localRegistrationId: number,
  remoteAddress: SignalClient.ProtocolAddress
): Promise<void> {
  // Create identity key
  const remoteIdentityKey = SignalClient.PublicKey.deserialize(
    bundle.identityKey
  );

  // Create signed prekey
  const signedPreKey = SignalClient.PublicKey.deserialize(
    bundle.signedPreKey.publicKey
  );

  // Create one-time prekey (if available)
  let oneTimePreKey: SignalClient.PublicKey | null = null;
  let oneTimePreKeyId: number | null = null;

  if (bundle.oneTimePreKey) {
    oneTimePreKey = SignalClient.PublicKey.deserialize(
      bundle.oneTimePreKey.publicKey
    );
    oneTimePreKeyId = bundle.oneTimePreKey.keyId;
  }

  // Create prekey bundle
  const prekeyBundle = SignalClient.PreKeyBundle.new(
    bundle.registrationId,
    parseInt(bundle.deviceId, 10),
    oneTimePreKeyId,
    oneTimePreKey,
    bundle.signedPreKey.keyId,
    signedPreKey,
    bundle.signedPreKey.signature,
    remoteIdentityKey
  );

  // Process bundle to create session
  const localIdentityKey = SignalClient.IdentityKeyPair.new(
    SignalClient.PublicKey.deserialize(localIdentityKeyPair.publicKey),
    SignalClient.PrivateKey.deserialize(localIdentityKeyPair.privateKey)
  );

  // This creates the session in the session store
  await SignalClient.processPreKeyBundle(
    prekeyBundle,
    remoteAddress,
    new InMemorySessionStore(),
    new InMemoryIdentityKeyStore(localIdentityKey, localRegistrationId)
  );
}

/**
 * Encrypt a message using Signal Protocol
 */
export async function encryptMessage(
  plaintext: string | Uint8Array,
  remoteAddress: SignalClient.ProtocolAddress,
  sessionStore: SignalClient.SessionStore,
  identityKeyStore: SignalClient.IdentityKeyStore
): Promise<EncryptedMessage> {
  const plaintextBytes =
    typeof plaintext === 'string' ? crypto.stringToBytes(plaintext) : plaintext;

  const ciphertext = await SignalClient.signalEncrypt(
    Buffer.from(plaintextBytes),
    remoteAddress,
    sessionStore,
    identityKeyStore
  );

  return {
    type: ciphertext.type() === 3 ? 'PreKey' : 'Normal',
    body: ciphertext.serialize(),
    registrationId: 0, // Set by caller
  };
}

/**
 * Decrypt a message using Signal Protocol
 */
export async function decryptMessage(
  encryptedMessage: EncryptedMessage,
  remoteAddress: SignalClient.ProtocolAddress,
  sessionStore: SignalClient.SessionStore,
  identityKeyStore: SignalClient.IdentityKeyStore,
  preKeyStore: SignalClient.PreKeyStore,
  signedPreKeyStore: SignalClient.SignedPreKeyStore
): Promise<Uint8Array> {
  let plaintext: Buffer;

  if (encryptedMessage.type === 'PreKey') {
    const prekeyMessage = SignalClient.PreKeySignalMessage.deserialize(
      Buffer.from(encryptedMessage.body)
    );

    plaintext = await SignalClient.signalDecryptPreKey(
      prekeyMessage,
      remoteAddress,
      sessionStore,
      identityKeyStore,
      preKeyStore,
      signedPreKeyStore
    );
  } else {
    const signalMessage = SignalClient.SignalMessage.deserialize(
      Buffer.from(encryptedMessage.body)
    );

    plaintext = await SignalClient.signalDecrypt(
      signalMessage,
      remoteAddress,
      sessionStore,
      identityKeyStore
    );
  }

  return new Uint8Array(plaintext);
}

// ============================================================================
// SESSION SERIALIZATION
// ============================================================================

/**
 * Serialize session state for storage
 */
export async function serializeSession(
  address: SignalClient.ProtocolAddress,
  sessionStore: SignalClient.SessionStore
): Promise<Uint8Array | null> {
  const sessionRecord = await sessionStore.getSession(address);
  if (!sessionRecord) {
    return null;
  }
  return new Uint8Array(sessionRecord.serialize());
}

/**
 * Deserialize session state from storage
 */
export function deserializeSession(data: Uint8Array): SignalClient.SessionRecord {
  return SignalClient.SessionRecord.deserialize(Buffer.from(data));
}

// ============================================================================
// IN-MEMORY STORES (for testing/temporary use)
// ============================================================================

class InMemorySessionStore extends SignalClient.SessionStore {
  private sessions: Map<string, SignalClient.SessionRecord> = new Map();

  async saveSession(
    address: SignalClient.ProtocolAddress,
    record: SignalClient.SessionRecord
  ): Promise<void> {
    const key = `${address.name()}.${address.deviceId()}`;
    this.sessions.set(key, record);
  }

  async getSession(
    address: SignalClient.ProtocolAddress
  ): Promise<SignalClient.SessionRecord | null> {
    const key = `${address.name()}.${address.deviceId()}`;
    return this.sessions.get(key) || null;
  }

  async getExistingSessions(
    addresses: SignalClient.ProtocolAddress[]
  ): Promise<SignalClient.SessionRecord[]> {
    const sessions: SignalClient.SessionRecord[] = [];
    for (const address of addresses) {
      const session = await this.getSession(address);
      if (session) {
        sessions.push(session);
      }
    }
    return sessions;
  }
}

class InMemoryIdentityKeyStore extends SignalClient.IdentityKeyStore {
  private identityKey: SignalClient.IdentityKeyPair;
  private registrationId: number;
  private trustedKeys: Map<string, SignalClient.PublicKey> = new Map();

  constructor(
    identityKey: SignalClient.IdentityKeyPair,
    registrationId: number
  ) {
    super();
    this.identityKey = identityKey;
    this.registrationId = registrationId;
  }

  async getIdentityKey(): Promise<SignalClient.IdentityKeyPair> {
    return this.identityKey;
  }

  async getLocalRegistrationId(): Promise<number> {
    return this.registrationId;
  }

  async saveIdentity(
    address: SignalClient.ProtocolAddress,
    key: SignalClient.PublicKey
  ): Promise<boolean> {
    const identifier = address.name();
    const existing = this.trustedKeys.get(identifier);

    this.trustedKeys.set(identifier, key);

    // Return true if this is a new key or key has changed
    return !existing || !existing.compare(key);
  }

  async isTrustedIdentity(
    address: SignalClient.ProtocolAddress,
    key: SignalClient.PublicKey,
    direction: SignalClient.Direction
  ): Promise<boolean> {
    const identifier = address.name();
    const trusted = this.trustedKeys.get(identifier);

    if (!trusted) {
      return true; // Trust on first use (TOFU)
    }

    return trusted.compare(key);
  }

  async getIdentity(
    address: SignalClient.ProtocolAddress
  ): Promise<SignalClient.PublicKey | null> {
    return this.trustedKeys.get(address.name()) || null;
  }
}

class InMemoryPreKeyStore extends SignalClient.PreKeyStore {
  private preKeys: Map<number, SignalClient.PreKeyRecord> = new Map();

  async savePreKey(
    id: number,
    record: SignalClient.PreKeyRecord
  ): Promise<void> {
    this.preKeys.set(id, record);
  }

  async getPreKey(id: number): Promise<SignalClient.PreKeyRecord> {
    const preKey = this.preKeys.get(id);
    if (!preKey) {
      throw new Error(`PreKey ${id} not found`);
    }
    return preKey;
  }

  async removePreKey(id: number): Promise<void> {
    this.preKeys.delete(id);
  }
}

class InMemorySignedPreKeyStore extends SignalClient.SignedPreKeyStore {
  private signedPreKeys: Map<number, SignalClient.SignedPreKeyRecord> =
    new Map();

  async saveSignedPreKey(
    id: number,
    record: SignalClient.SignedPreKeyRecord
  ): Promise<void> {
    this.signedPreKeys.set(id, record);
  }

  async getSignedPreKey(id: number): Promise<SignalClient.SignedPreKeyRecord> {
    const signedPreKey = this.signedPreKeys.get(id);
    if (!signedPreKey) {
      throw new Error(`SignedPreKey ${id} not found`);
    }
    return signedPreKey;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  InMemorySessionStore,
  InMemoryIdentityKeyStore,
  InMemoryPreKeyStore,
  InMemorySignedPreKeyStore,
};

export const signalClient = {
  // Identity keys
  generateIdentityKeyPair,
  getPublicIdentityKey,

  // Signed prekeys
  generateSignedPreKey,

  // One-time prekeys
  generateOneTimePreKeys,

  // Sessions
  processPreKeyBundle,
  encryptMessage,
  decryptMessage,
  serializeSession,
  deserializeSession,
};

export default signalClient;
