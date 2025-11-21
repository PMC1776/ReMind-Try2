import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { LocationPreset, EncryptedLocationPreset, CreateLocationPresetInput, UpdateLocationPresetInput } from "../types";
import { locationPresetsAPI } from "../utils/api";
import {
  encryptWithSecretbox,
  decryptWithSecretbox,
  ensureSecretKey,
  getPresetIcon,
} from "../utils/encryption";
import { secureStorage } from "../utils/secureStorage";
import { saveLocationPresets, loadLocationPresets } from "../utils/storage";

type LocationPresetsContextType = {
  presets: LocationPreset[];
  loading: boolean;
  createPreset: (input: CreateLocationPresetInput) => Promise<LocationPreset>;
  updatePreset: (id: string, updates: UpdateLocationPresetInput) => Promise<LocationPreset>;
  deletePreset: (id: string) => Promise<void>;
  refreshPresets: () => Promise<void>;
};

const LocationPresetsContext = createContext<LocationPresetsContextType | undefined>(undefined);

export function LocationPresetsProvider({ children }: { children: ReactNode }) {
  const [presets, setPresets] = useState<LocationPreset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      // Load from local storage first (fast)
      const localPresets = await loadLocationPresets();
      setPresets(localPresets);
      console.log(`Loaded ${localPresets.length} location presets from local storage`);

      // Then try to sync with backend (if available)
      const user = await secureStorage.getItem("user");
      if (!user) {
        console.log("No user found, using local presets only");
        setLoading(false);
        return;
      }

      try {
        console.log("Syncing location presets with backend...");

        // Ensure secret key exists
        const secretKey = await ensureSecretKey();

        // Fetch from backend
        const encryptedPresets: EncryptedLocationPreset[] = await locationPresetsAPI.getAll();

        console.log(`Loaded ${encryptedPresets.length} location presets from backend`);

        // Decrypt each preset
        const decryptedPresets: LocationPreset[] = encryptedPresets.map((preset) => {
          try {
            const decryptedName = decryptWithSecretbox(preset.name, secretKey);
            const decryptedAddress = preset.address
              ? decryptWithSecretbox(preset.address, secretKey)
              : null;

            return {
              ...preset,
              name: decryptedName,
              address: decryptedAddress,
            };
          } catch (error) {
            console.error("Failed to decrypt preset:", preset.id, error);
            return {
              ...preset,
              name: "[Unable to decrypt]",
              address: "[Encrypted]",
            };
          }
        });

        // Update state and local storage with backend data
        setPresets(decryptedPresets);
        await saveLocationPresets(decryptedPresets);
      } catch (error) {
        console.log("Backend sync failed, using local presets:", error);
        // Keep using local presets if backend sync fails
      }
    } catch (error) {
      console.error("Failed to load location presets:", error);
      setPresets([]);
    } finally {
      setLoading(false);
    }
  };

  const createPreset = async (input: CreateLocationPresetInput): Promise<LocationPreset> => {
    try {
      // Auto-assign icon if not provided
      const icon = input.icon || getPresetIcon(input.name);

      // Create preset locally first
      const newPreset: LocationPreset = {
        id: `local-${Date.now()}`, // Temporary local ID
        userId: "local",
        name: input.name,
        coordinates: input.coordinates,
        address: input.address || null,
        icon,
        createdAt: Math.floor(Date.now() / 1000),
      };

      // Update local state and storage immediately
      const updatedPresets = [...presets, newPreset];
      setPresets(updatedPresets);
      await saveLocationPresets(updatedPresets);

      // Try to sync with backend in background
      try {
        const secretKey = await ensureSecretKey();

        // Encrypt name and address
        const encryptedName = encryptWithSecretbox(input.name, secretKey);
        const encryptedAddress = input.address
          ? encryptWithSecretbox(input.address, secretKey)
          : null;

        // Create on backend
        const encryptedPreset: EncryptedLocationPreset = await locationPresetsAPI.create({
          name: encryptedName,
          coordinates: input.coordinates,
          address: encryptedAddress,
          icon,
        });

        // Update with backend ID
        const backendPreset: LocationPreset = {
          ...encryptedPreset,
          name: input.name,
          address: input.address || null,
        };

        // Replace local preset with backend version
        const finalPresets = updatedPresets.map(p =>
          p.id === newPreset.id ? backendPreset : p
        );
        setPresets(finalPresets);
        await saveLocationPresets(finalPresets);

        console.log("Location preset synced to backend");
      } catch (error) {
        console.log("Backend sync failed, preset saved locally:", error);
        // Preset is already saved locally, so we can continue
      }

      return newPreset;
    } catch (error) {
      console.error("Failed to create location preset:", error);
      throw error;
    }
  };

  const updatePreset = async (id: string, updates: UpdateLocationPresetInput): Promise<LocationPreset> => {
    try {
      // Find the preset to update
      const presetToUpdate = presets.find(p => p.id === id);
      if (!presetToUpdate) {
        throw new Error("Preset not found");
      }

      // Update locally first
      const updatedPreset: LocationPreset = {
        ...presetToUpdate,
        ...updates,
        name: updates.name !== undefined ? updates.name : presetToUpdate.name,
        address: updates.address !== undefined ? updates.address : presetToUpdate.address,
      };

      // Update local state and storage immediately
      const updatedPresets = presets.map(p => p.id === id ? updatedPreset : p);
      setPresets(updatedPresets);
      await saveLocationPresets(updatedPresets);

      // Try to sync with backend in background
      try {
        const secretKey = await ensureSecretKey();

        // Encrypt updated fields
        const encryptedUpdates: any = { ...updates };
        if (updates.name !== undefined) {
          encryptedUpdates.name = encryptWithSecretbox(updates.name, secretKey);
        }
        if (updates.address !== undefined) {
          encryptedUpdates.address = updates.address
            ? encryptWithSecretbox(updates.address, secretKey)
            : null;
        }

        // Update on backend
        await locationPresetsAPI.update(id, encryptedUpdates);
        console.log("Location preset synced to backend");
      } catch (error) {
        console.log("Backend sync failed, preset updated locally:", error);
        // Preset is already updated locally
      }

      return updatedPreset;
    } catch (error) {
      console.error("Failed to update location preset:", error);
      throw error;
    }
  };

  const deletePreset = async (id: string): Promise<void> => {
    try {
      // Delete locally first
      const updatedPresets = presets.filter(p => p.id !== id);
      setPresets(updatedPresets);
      await saveLocationPresets(updatedPresets);

      // Try to sync with backend in background
      try {
        await locationPresetsAPI.delete(id);
        console.log("Location preset deletion synced to backend");
      } catch (error) {
        console.log("Backend sync failed, preset deleted locally:", error);
        // Preset is already deleted locally
      }
    } catch (error) {
      console.error("Failed to delete location preset:", error);
      throw error;
    }
  };

  const refreshPresets = async () => {
    await loadPresets();
  };

  return (
    <LocationPresetsContext.Provider
      value={{
        presets,
        loading,
        createPreset,
        updatePreset,
        deletePreset,
        refreshPresets,
      }}
    >
      {children}
    </LocationPresetsContext.Provider>
  );
}

export function useLocationPresets() {
  const context = useContext(LocationPresetsContext);
  if (!context) {
    throw new Error("useLocationPresets must be used within a LocationPresetsProvider");
  }
  return context;
}
