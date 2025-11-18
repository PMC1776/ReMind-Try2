import nacl from "tweetnacl";
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from "tweetnacl-util";
import { secureStorage } from "./secureStorage";

export interface EncryptionKeys {
  publicKey: string;
  privateKey: string;
}

export async function generateKeypair(): Promise<EncryptionKeys> {
  const keypair = nacl.box.keyPair();
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
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageUint8 = encodeUTF8(text) as Uint8Array;
  const publicKeyUint8 = decodeBase64(publicKey) as Uint8Array;
  
  const ephemeralKeypair = nacl.box.keyPair();
  
  const encrypted = nacl.box(
    messageUint8,
    nonce,
    publicKeyUint8,
    ephemeralKeypair.secretKey
  );

  if (!encrypted) {
    throw new Error("Encryption failed");
  }

  const fullMessage = new Uint8Array(
    nonce.length + ephemeralKeypair.publicKey.length + encrypted.length
  );
  fullMessage.set(nonce);
  fullMessage.set(ephemeralKeypair.publicKey, nonce.length);
  fullMessage.set(encrypted, nonce.length + ephemeralKeypair.publicKey.length);

  return encodeBase64(fullMessage as any);
}

export function decrypt(encryptedText: string, privateKey: string): string {
  const messageWithNonceAsUint8Array = decodeBase64(encryptedText) as Uint8Array;
  const nonce = messageWithNonceAsUint8Array.slice(0, nacl.box.nonceLength);
  const ephemeralPublicKey = messageWithNonceAsUint8Array.slice(
    nacl.box.nonceLength,
    nacl.box.nonceLength + nacl.box.publicKeyLength
  );
  const encryptedMessage = messageWithNonceAsUint8Array.slice(
    nacl.box.nonceLength + nacl.box.publicKeyLength
  );

  const privateKeyUint8 = decodeBase64(privateKey) as Uint8Array;

  const decrypted = nacl.box.open(
    encryptedMessage,
    nonce,
    ephemeralPublicKey,
    privateKeyUint8
  );

  if (!decrypted) {
    throw new Error("Decryption failed");
  }

  return decodeUTF8(decrypted as any);
}

export function getRecoveryKey(privateKey: string): string {
  return privateKey;
}

export function restoreFromRecoveryKey(recoveryKey: string): EncryptionKeys {
  const privateKey = recoveryKey;
  const privateKeyUint8 = decodeBase64(privateKey);
  const keypair = nacl.box.keyPair.fromSecretKey(privateKeyUint8);
  
  return {
    publicKey: encodeBase64(keypair.publicKey),
    privateKey: privateKey,
  };
}
