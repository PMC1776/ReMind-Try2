import * as SecureStore from "expo-secure-store";

/**
 * Secure storage wrapper using Expo SecureStore for sensitive data
 * SecureStore uses iOS Keychain and Android Keystore for secure, encrypted storage
 */

export const secureStorage = {
  /**
   * Save a value securely
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`Failed to save ${key} to secure storage:`, error);
      throw error;
    }
  },

  /**
   * Retrieve a value from secure storage
   */
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Failed to retrieve ${key} from secure storage:`, error);
      return null;
    }
  },

  /**
   * Delete a value from secure storage
   */
  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Failed to remove ${key} from secure storage:`, error);
      throw error;
    }
  },

  /**
   * Remove multiple items from secure storage
   */
  async multiRemove(keys: string[]): Promise<void> {
    try {
      await Promise.all(keys.map((key) => SecureStore.deleteItemAsync(key)));
    } catch (error) {
      console.error("Failed to remove multiple items from secure storage:", error);
      throw error;
    }
  },
};
