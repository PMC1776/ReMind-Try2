import nacl from "tweetnacl";
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from "tweetnacl-util";
import { secureStorage } from "./secureStorage";
import * as Crypto from "expo-crypto";

// Polyfill for crypto.getRandomValues (required for tweetnacl in React Native)
if (typeof crypto === "undefined") {
  (global as any).crypto = {
    getRandomValues: (buffer: Uint8Array) => {
      const randomBytes = Crypto.getRandomBytes(buffer.length);
      buffer.set(randomBytes);
      return buffer;
    },
  };
} else if (!crypto.getRandomValues) {
  crypto.getRandomValues = (buffer: Uint8Array) => {
    const randomBytes = Crypto.getRandomBytes(buffer.length);
    buffer.set(randomBytes);
    return buffer;
  };
}

export interface EncryptionKeys {
  publicKey: string;
  privateKey: string;
}

export async function generateKeypair(): Promise<EncryptionKeys> {
  // Generate random bytes for the seed using expo-crypto
  const seed = Crypto.getRandomBytes(32);
  const keypair = nacl.box.keyPair.fromSecretKey(Uint8Array.from(seed));
  return {
    publicKey: encodeBase64(keypair.publicKey),
    privateKey: encodeBase64(keypair.secretKey),
  };
}

export async function saveKeys(keys: EncryptionKeys): Promise<void> {
  await secureStorage.setItem("encryptionKeys", JSON.stringify(keys));
}

export async function loadKeys(): Promise<EncryptionKeys | null> {
  const stored = await secureStorage.getItem("encryptionKeys");
  return stored ? JSON.parse(stored) : null;
}

export function encrypt(text: string, publicKey: string): string {
  try {
    // Convert text to Uint8Array using TextEncoder for better React Native compatibility
    const encoder = new TextEncoder();
    const messageUint8 = encoder.encode(text);

    // Decode public key from base64 to Uint8Array
    const publicKeyBytes = decodeBase64(publicKey);
    const publicKeyUint8 = Uint8Array.from(publicKeyBytes as any);

    // Generate random nonce - use Uint8Array.from() for React Native compatibility
    const nonceBytes = Crypto.getRandomBytes(nacl.box.nonceLength);
    const nonce = Uint8Array.from(nonceBytes);

    // Generate ephemeral keypair for this encryption
    const ephemeralSeed = Crypto.getRandomBytes(32);
    const ephemeralKeypair = nacl.box.keyPair.fromSecretKey(Uint8Array.from(ephemeralSeed));

    // Encrypt the message
    const encrypted = nacl.box(
      messageUint8,
      nonce,
      publicKeyUint8,
      ephemeralKeypair.secretKey
    );

    if (!encrypted) {
      throw new Error("Encryption failed");
    }

    // Combine nonce + ephemeral public key + encrypted message
    const fullMessage = new Uint8Array(
      nonce.length + ephemeralKeypair.publicKey.length + encrypted.length
    );
    fullMessage.set(nonce, 0);
    fullMessage.set(ephemeralKeypair.publicKey, nonce.length);
    fullMessage.set(encrypted, nonce.length + ephemeralKeypair.publicKey.length);

    return encodeBase64(fullMessage);
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function decrypt(encryptedText: string, privateKey: string): string {
  try {
    // Force to string to handle any weird type coercion issues
    const encryptedStr = String(encryptedText);
    const privateKeyStr = String(privateKey);

    // Validate input types
    if (typeof encryptedText !== 'string') {
      throw new Error(`encryptedText: expected string, got ${typeof encryptedText}`);
    }
    if (typeof privateKey !== 'string') {
      throw new Error(`privateKey: expected string, got ${typeof privateKey}`);
    }
    if (!encryptedText) {
      throw new Error('Encrypted text is empty');
    }
    if (!privateKey) {
      throw new Error('Private key is empty');
    }

    // Decode the full message from base64
    let fullMessageBytes;
    try {
      fullMessageBytes = decodeBase64(encryptedStr);
    } catch (e) {
      throw new Error(`Failed to decode encrypted text from base64: ${e instanceof Error ? e.message : String(e)}`);
    }
    const fullMessage = Uint8Array.from(fullMessageBytes as any);

    // Extract nonce, ephemeral public key, and encrypted message
    const nonce = fullMessage.slice(0, nacl.box.nonceLength);
    const ephemeralPublicKey = fullMessage.slice(
      nacl.box.nonceLength,
      nacl.box.nonceLength + nacl.box.publicKeyLength
    );
    const encryptedMessage = fullMessage.slice(
      nacl.box.nonceLength + nacl.box.publicKeyLength
    );

    // Decode private key from base64
    let privateKeyBytes;
    try {
      privateKeyBytes = decodeBase64(privateKeyStr);
    } catch (e) {
      throw new Error(`Failed to decode private key from base64: ${e instanceof Error ? e.message : String(e)}`);
    }
    const privateKeyUint8 = Uint8Array.from(privateKeyBytes as any);

    // Decrypt the message
    const decrypted = nacl.box.open(
      encryptedMessage,
      nonce,
      ephemeralPublicKey,
      privateKeyUint8
    );

    if (!decrypted) {
      throw new Error("Decryption failed - message could not be authenticated");
    }

    // Use TextDecoder for UTF8 decoding (better React Native compatibility than tweetnacl-util)
    try {
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(decrypted);
    } catch (e) {
      // Fallback: Manual UTF8 decoding
      const bytes = Array.from(decrypted);
      return bytes.map(byte => String.fromCharCode(byte)).join('');
    }
  } catch (error) {
    console.error("Decryption error:", error);
    throw error;
  }
}

export function getRecoveryKey(privateKey: string): string {
  return privateKey;
}

export function restoreFromRecoveryKey(recoveryKey: string): EncryptionKeys {
  try {
    const privateKey = recoveryKey;
    const privateKeyBytes = decodeBase64(privateKey);
    const privateKeyUint8 = Uint8Array.from(privateKeyBytes as any);
    const keypair = nacl.box.keyPair.fromSecretKey(privateKeyUint8);

    return {
      publicKey: encodeBase64(keypair.publicKey),
      privateKey: privateKey,
    };
  } catch (error) {
    console.error("Recovery key restore error:", error);
    throw new Error(`Failed to restore from recovery key: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// ========== Secretbox (Symmetric) Encryption for Location Presets ==========

export async function generateSecretKey(): Promise<string> {
  const key = Crypto.getRandomBytes(nacl.secretbox.keyLength); // 32 bytes
  return encodeBase64(Uint8Array.from(key));
}

export async function saveSecretKey(key: string): Promise<void> {
  await secureStorage.setItem("secretKey", key);
}

export async function loadSecretKey(): Promise<string | null> {
  return await secureStorage.getItem("secretKey");
}

export async function ensureSecretKey(): Promise<string> {
  let key = await loadSecretKey();
  if (!key) {
    console.log("No secret key found, generating new one...");
    key = await generateSecretKey();
    await saveSecretKey(key);
  }
  return key;
}

export function encryptWithSecretbox(text: string, secretKey: string): string {
  try {
    const encoder = new TextEncoder();
    const message = encoder.encode(text);

    const nonceBytes = Crypto.getRandomBytes(nacl.secretbox.nonceLength); // 24 bytes
    const nonce = Uint8Array.from(nonceBytes);

    const secretKeyBytes = decodeBase64(secretKey);
    const secretKeyUint8 = Uint8Array.from(secretKeyBytes as any);

    const encrypted = nacl.secretbox(message, nonce, secretKeyUint8);

    if (!encrypted) {
      throw new Error("Encryption failed");
    }

    // Return as JSON string with encrypted and nonce
    return JSON.stringify({
      encrypted: encodeBase64(encrypted),
      nonce: encodeBase64(nonce),
    });
  } catch (error) {
    console.error("Secretbox encryption error:", error);
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function decryptWithSecretbox(encryptedJson: string, secretKey: string): string {
  try {
    // Parse the JSON
    const { encrypted, nonce } = JSON.parse(encryptedJson);

    // Decode from base64
    const encryptedBytes = decodeBase64(encrypted);
    const nonceBytes = decodeBase64(nonce);
    const secretKeyBytes = decodeBase64(secretKey);

    const encryptedUint8 = Uint8Array.from(encryptedBytes as any);
    const nonceUint8 = Uint8Array.from(nonceBytes as any);
    const secretKeyUint8 = Uint8Array.from(secretKeyBytes as any);

    // Decrypt
    const decrypted = nacl.secretbox.open(encryptedUint8, nonceUint8, secretKeyUint8);

    if (!decrypted) {
      throw new Error("Decryption failed - message could not be authenticated");
    }

    // Decode UTF-8
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(decrypted);
  } catch (error) {
    console.error("Secretbox decryption error:", error);
    throw error;
  }
}

// Helper function to auto-assign icon based on preset name
export function getPresetIcon(name: string): string {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('home')) return '🏠';
  if (nameLower.includes('work') || nameLower.includes('office')) return '💼';
  if (nameLower.includes('school') || nameLower.includes('university') || nameLower.includes('college')) return '🎓';
  if (nameLower.includes('gym') || nameLower.includes('fitness')) return '💪';
  if (nameLower.includes('store') || nameLower.includes('shop') || nameLower.includes('market')) return '🛒';
  if (nameLower.includes('restaurant') || nameLower.includes('cafe') || nameLower.includes('coffee')) return '🍽️';
  if (nameLower.includes('park')) return '🌳';
  if (nameLower.includes('hospital') || nameLower.includes('doctor') || nameLower.includes('clinic')) return '🏥';
  if (nameLower.includes('church') || nameLower.includes('temple') || nameLower.includes('mosque')) return '⛪';
  return '📍'; // Default
}
