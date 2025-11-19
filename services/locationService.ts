export interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

// Format address as "123 Main St, City"
export function formatAddress(displayName: string, address?: SearchResult["address"]): string {
  if (!address) return displayName;

  const streetAddress = [address.house_number, address.road].filter(Boolean).join(" ");
  const locality = address.city || address.town || address.village;

  if (streetAddress && locality) {
    return `${streetAddress}, ${locality}`;
  } else if (locality && address.state) {
    return `${locality}, ${address.state}`;
  } else if (locality) {
    return locality;
  }

  return displayName;
}

// Search locations with OpenStreetMap Nominatim API
export async function searchLocation(
  query: string,
  userPosition?: { latitude: number; longitude: number }
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  let url = `https://nominatim.openstreetmap.org/search?` +
    `format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1`;

  // Add geographic biasing if user position available
  if (userPosition) {
    const viewbox = [
      userPosition.longitude - 0.5,
      userPosition.latitude + 0.5,
      userPosition.longitude + 0.5,
      userPosition.latitude - 0.5,
    ].join(",");

    url += `&viewbox=${viewbox}&bounded=1`;
  }

  const response = await fetch(url, {
    headers: { "User-Agent": "RemindApp/2.0" },
  });

  if (!response.ok) {
    throw new Error("Failed to search locations");
  }

  return response.json();
}

// Reverse geocode coordinates to address
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?` +
    `format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
    { headers: { "User-Agent": "RemindApp/2.0" } }
  );

  if (!response.ok) {
    throw new Error("Failed to reverse geocode");
  }

  const data = await response.json();
  const addr = data.address;

  if (!addr) {
    return data.display_name || "Current Location";
  }

  const streetAddress = [addr.house_number, addr.road].filter(Boolean).join(" ");
  const locality = addr.city || addr.town || addr.village;

  if (streetAddress && locality) {
    return `${streetAddress}, ${locality}`;
  } else if (locality && addr.state) {
    return `${locality}, ${addr.state}`;
  } else if (locality) {
    return locality;
  }

  return data.display_name || "Current Location";
}

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Format distance for display
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km`;
  } else {
    return `${Math.round(distanceKm)}km`;
  }
}
