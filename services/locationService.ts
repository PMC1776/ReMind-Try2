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
    suburb?: string;
    neighbourhood?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

// Rate limiting for Nominatim (1 request per second max)
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1100; // 1.1 seconds to be safe

async function makeNominatimRequest(url: string) {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();

  return fetch(url, {
    headers: { 'User-Agent': 'ReMindApp/1.0' }
  });
}

// Search result cache (5 minutes)
const searchCache = new Map<string, { results: SearchResult[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Format address intelligently from components
export function formatAddressFromComponents(
  displayName: string,
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    neighbourhood?: string;
    county?: string;
    state?: string;
  }
): string {
  if (!address) return displayName;

  const parts: string[] = [];

  // Build street address
  const streetAddress = [address.house_number, address.road].filter(Boolean).join(' ');

  // Get locality with fallback chain
  const locality = address.city || address.town || address.village ||
                   address.suburb || address.neighbourhood || address.county;

  // Combine intelligently
  if (streetAddress && locality) {
    parts.push(streetAddress, locality);
  } else if (streetAddress) {
    parts.push(streetAddress);
    if (address.state) parts.push(address.state);
  } else if (locality) {
    parts.push(locality);
    if (address.state) parts.push(address.state);
  } else if (address.state) {
    parts.push(address.state);
  }

  return parts.length > 0 ? parts.join(', ') : displayName;
}

// Legacy function for backwards compatibility
export function formatAddress(displayName: string, address?: SearchResult["address"]): string {
  return formatAddressFromComponents(displayName, address);
}

// Search locations with OpenStreetMap Nominatim API
export async function searchLocation(
  query: string,
  userPosition?: { latitude: number; longitude: number }
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  // Check cache first (cache by query only since we're not using position for biasing)
  const cacheKey = query.toLowerCase();
  const cached = searchCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Using cached search results for:', query);
    return cached.results;
  }

  let url = `https://nominatim.openstreetmap.org/search?` +
    `format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1`;

  // No geographic restriction - allow global search
  // Users can search for any location worldwide

  const response = await makeNominatimRequest(url);

  if (!response.ok) {
    throw new Error("Failed to search locations");
  }

  const data = await response.json();

  // Cache the results
  searchCache.set(cacheKey, { results: data, timestamp: Date.now() });

  return data;
}

// Reverse geocode coordinates to address
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string> {
  const response = await makeNominatimRequest(
    `https://nominatim.openstreetmap.org/reverse?` +
    `format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
  );

  if (!response.ok) {
    throw new Error("Failed to reverse geocode");
  }

  const data = await response.json();
  const addr = data.address;

  if (!addr) {
    return data.display_name || "Current Location";
  }

  // Use the smart formatting function
  return formatAddressFromComponents(data.display_name, addr);
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
export function formatDistance(distanceKm: number, unit: "miles" | "km" = "miles"): string {
  if (unit === "miles") {
    const distanceMiles = distanceKm * 0.621371; // Convert km to miles
    if (distanceMiles < 0.1) {
      const feet = Math.round(distanceMiles * 5280);
      return `${feet}ft`;
    } else if (distanceMiles < 10) {
      return `${distanceMiles.toFixed(1)}mi`;
    } else {
      return `${Math.round(distanceMiles)}mi`;
    }
  } else {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    } else if (distanceKm < 10) {
      return `${distanceKm.toFixed(1)}km`;
    } else {
      return `${Math.round(distanceKm)}km`;
    }
  }
}
