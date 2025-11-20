import { generateKeypair, saveKeys, loadKeys } from "./encryption";

/**
 * Ensures encryption keys exist for the current user.
 * If keys don't exist, generates new ones.
 *
 * NOTE: Generating new keys means old reminders cannot be decrypted!
 * Ideally, users should import their recovery key instead.
 */
export async function ensureEncryptionKeys(): Promise<void> {
  const existingKeys = await loadKeys();

  if (existingKeys) {
    console.log("✅ Encryption keys found");
    return;
  }

  console.log("⚠️ No encryption keys found - generating new keys");
  console.log("⚠️ Warning: Old encrypted reminders will not be accessible");

  const newKeys = await generateKeypair();
  await saveKeys(newKeys);

  console.log("✅ New encryption keys generated and saved");
}
