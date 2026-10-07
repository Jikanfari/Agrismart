/**
 * Robust Local Data Encryption Service
 * Implements AES-GCM (256-bit) with PBKDF2 (100,000 iterations of SHA-256)
 * for sensitive user records (finances, sales, credentials, harvest values, personal notes).
 */

const DEFAULT_MASTER_SALT = 'agri-smart-sec-salt-2026';
const STORAGE_PASSPHRASE_KEY = 'agrismart_encryption_passphrase';

// In-memory cached key to avoid re-deriving on every single read/write
let cachedCryptoKey: CryptoKey | null = null;
let currentPassphrase = localStorage.getItem(STORAGE_PASSPHRASE_KEY) || 'AgriFarm@Secure2026';

export interface EncryptedPayload {
  ciphertext: string; // Base64
  iv: string; // Base64
  salt: string; // Base64
  algorithm: 'AES-256-GCM';
  timestamp: number;
}

/**
 * Derives an AES-GCM 256-bit CryptoKey from passphrase and salt
 */
async function deriveKey(passphrase: string, saltBytes: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encrypt any JS object or string using AES-GCM-256
 */
export async function encryptSensitiveData<T>(data: T, passphrase = currentPassphrase): Promise<string> {
  try {
    const enc = new TextEncoder();
    const jsonString = JSON.stringify(data);
    const plaintextBytes = enc.encode(jsonString);

    // Generate random 16-byte salt and 12-byte IV for every encryption call
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const key = await deriveKey(passphrase, salt);
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as BufferSource,
      },
      key,
      plaintextBytes as unknown as BufferSource
    );

    const envelope: EncryptedPayload = {
      ciphertext: bufferToBase64(ciphertext),
      iv: bufferToBase64(iv),
      salt: bufferToBase64(salt),
      algorithm: 'AES-256-GCM',
      timestamp: Date.now(),
    };

    return JSON.stringify(envelope);
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt sensitive data');
  }
}

/**
 * Decrypt an AES-GCM-256 payload back to original typed data
 */
export async function decryptSensitiveData<T>(encryptedString: string, passphrase = currentPassphrase): Promise<T> {
  try {
    const envelope: EncryptedPayload = JSON.parse(encryptedString);
    if (envelope.algorithm !== 'AES-256-GCM') {
      throw new Error('Unsupported encryption algorithm');
    }

    const salt = base64ToBuffer(envelope.salt);
    const iv = base64ToBuffer(envelope.iv);
    const ciphertext = base64ToBuffer(envelope.ciphertext);

    const key = await deriveKey(passphrase, salt);
    const decryptedBytes = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as BufferSource,
      },
      key,
      ciphertext as unknown as BufferSource
    );

    const dec = new TextDecoder();
    const jsonString = dec.decode(decryptedBytes);
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Decryption failed. Invalid key or corrupted ciphertext.');
  }
}

export function isEncryptedEnvelope(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  try {
    const parsed = JSON.parse(value);
    return (
      parsed &&
      typeof parsed === 'object' &&
      parsed.algorithm === 'AES-256-GCM' &&
      typeof parsed.ciphertext === 'string' &&
      typeof parsed.iv === 'string' &&
      typeof parsed.salt === 'string'
    );
  } catch {
    return false;
  }
}

export function setCustomEncryptionPassphrase(newPassphrase: string) {
  if (!newPassphrase || newPassphrase.length < 6) {
    throw new Error('Passphrase must be at least 6 characters');
  }
  currentPassphrase = newPassphrase;
  localStorage.setItem(STORAGE_PASSPHRASE_KEY, newPassphrase);
  cachedCryptoKey = null;
}

export function getEncryptionPassphrase(): string {
  return currentPassphrase;
}

export function resetEncryptionKey() {
  currentPassphrase = 'AgriFarm@Secure2026';
  localStorage.removeItem(STORAGE_PASSPHRASE_KEY);
  cachedCryptoKey = null;
}
