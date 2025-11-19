import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { Coordinates } from "../types";

export interface LocationPermissionState {
  position: Coordinates | null;
  permissionStatus: string;
  error: string | null;
  isLoading: boolean;
}

export function useLocationPermission() {
  const [position, setPosition] = useState<Coordinates | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>("undetermined");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      try {
        setIsLoading(true);

        // Request permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        setPermissionStatus(status);

        if (status !== "granted") {
          setError("Location permission not granted");
          setIsLoading(false);
          return;
        }

        // Get initial position
        const currentPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setPosition({
          latitude: currentPosition.coords.latitude,
          longitude: currentPosition.coords.longitude,
        });

        // Watch position changes (update every 10 meters)
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 10, // Update every 10 meters
          },
          (newPosition) => {
            setPosition({
              latitude: newPosition.coords.latitude,
              longitude: newPosition.coords.longitude,
            });
          }
        );

        setIsLoading(false);
      } catch (err) {
        console.error("Location error:", err);
        setError(err instanceof Error ? err.message : "Failed to get location");
        setIsLoading(false);
      }
    })();

    return () => {
      subscription?.remove();
    };
  }, []);

  return { position, permissionStatus, error, isLoading };
}
