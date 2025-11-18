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
  const keypair = nacl.box.keyPair.fromSecretKey(new Uint8Array(seed));
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
    // Convert text to Uint8Array
    const messageBytes = encodeUTF8(text);
    const messageUint8 = new Uint8Array(messageBytes as any);

    // Decode public key from base64 to Uint8Array
    const publicKeyBytes = decodeBase64(publicKey);
    const publicKeyUint8 = new Uint8Array(publicKeyBytes as any);

    // Generate random nonce
    const nonceBytes = Crypto.getRandomBytes(nacl.box.nonceLength);
    const nonce = new Uint8Array(nonceBytes);

    // Generate ephemeral keypair for this encryption
    const ephemeralSeed = Crypto.getRandomBytes(32);
    const ephemeralKeypair = nacl.box.keyPair.fromSecretKey(new Uint8Array(ephemeralSeed));

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
    console.error("Encryption error details:", error);
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function decrypt(encryptedText: string, privateKey: string): string {
  try {
    // Decode the full message from base64
    const fullMessageBytes = decodeBase64(encryptedText);
    const fullMessage = new Uint8Array(fullMessageBytes as any);

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
    const privateKeyBytes = decodeBase64(privateKey);
    const privateKeyUint8 = new Uint8Array(privateKeyBytes as any);

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

    return decodeUTF8(decrypted);
  } catch (error) {
    console.error("Decryption error details:", error);
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function getRecoveryKey(privateKey: string): string {
  return privateKey;
}

export function restoreFromRecoveryKey(recoveryKey: string): EncryptionKeys {
  try {
    const privateKey = recoveryKey;
    const privateKeyBytes = decodeBase64(privateKey);
    const privateKeyUint8 = new Uint8Array(privateKeyBytes as any);
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
