import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Encryption utilities for securely storing MCP server credentials.
 * Uses AES-256-GCM for authenticated encryption (confidentiality + integrity).
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits - recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits for AES-256

/**
 * Gets and validates the encryption key from environment variables.
 * The key must be exactly 32 bytes (256 bits) for AES-256.
 * Can be provided as hex (64 chars) or base64 (44 chars).
 */
function getEncryptionKey(): Buffer {
  const keyEnv = process.env.ENCRYPTION_KEY;

  if (!keyEnv) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }

  let keyBuffer: Buffer;

  // Try to parse as hex first (64 hex characters = 32 bytes)
  if (/^[0-9a-fA-F]{64}$/.test(keyEnv)) {
    keyBuffer = Buffer.from(keyEnv, "hex");
  }
  // Try to parse as base64 (44 characters = 32 bytes when decoded)
  else if (/^[A-Za-z0-9+/]{43}=$/.test(keyEnv)) {
    keyBuffer = Buffer.from(keyEnv, "base64");
  } else {
    throw new Error(
      `ENCRYPTION_KEY must be a 64-character hex string or 44-character base64 string (32 bytes). Got ${keyEnv.length} characters.`,
    );
  }

  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(
      `ENCRYPTION_KEY must decode to exactly ${KEY_LENGTH} bytes for AES-256. Got ${keyBuffer.length} bytes.`,
    );
  }

  return keyBuffer;
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a base64-encoded string containing: IV (12 bytes) + AuthTag (16 bytes) + Ciphertext
 *
 * @param plaintext - The string to encrypt
 * @returns Base64-encoded string containing IV, auth tag, and ciphertext
 * @throws Error if ENCRYPTION_KEY is not set or invalid
 */
export function encrypt(plaintext: string): string {
  // Handle edge cases
  if (plaintext === null || plaintext === undefined) {
    return "";
  }

  if (plaintext === "") {
    return "";
  }

  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);

  const authTag = cipher.getAuthTag();

  // Combine: IV + AuthTag + Ciphertext
  const combined = Buffer.concat([iv, authTag, encrypted]);

  return combined.toString("base64");
}

/**
 * Decrypts a base64-encoded ciphertext that was encrypted with encrypt().
 * Expects format: IV (12 bytes) + AuthTag (16 bytes) + Ciphertext
 *
 * @param ciphertext - Base64-encoded string from encrypt()
 * @returns The original plaintext string
 * @throws Error if ENCRYPTION_KEY is not set, invalid, or if decryption fails (tampered data)
 */
export function decrypt(ciphertext: string): string {
  // Handle edge cases
  if (ciphertext === null || ciphertext === undefined) {
    return "";
  }

  if (ciphertext === "") {
    return "";
  }

  const key = getEncryptionKey();
  const combined = Buffer.from(ciphertext, "base64");

  // Minimum length: IV + AuthTag + at least 1 byte of ciphertext
  const minLength = IV_LENGTH + AUTH_TAG_LENGTH;
  if (combined.length <= minLength) {
    throw new Error("Invalid ciphertext: too short");
  }

  // Extract components
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    // GCM authentication failure - data was tampered with or wrong key
    throw new Error("Decryption failed: authentication tag mismatch (data may be corrupted or tampered)");
  }
}

/**
 * Generates a random 256-bit encryption key suitable for use as ENCRYPTION_KEY.
 * Returns the key as a 64-character hex string.
 *
 * Usage: Run this once to generate a key, then store it securely in your environment.
 */
export function generateEncryptionKey(): string {
  return randomBytes(KEY_LENGTH).toString("hex");
}
