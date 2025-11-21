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
const MIN_REQUEST_INTERVAL = 1500; // 1.5 seconds to be more conservative

async function makeNominatimRequest(url: string, retries = 2) {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'ReMindApp/1.0' }
    });

    // If 503 (service unavailable) and we have retries left, wait and retry
    if (response.status === 503 && retries > 0) {
      console.log(`Nominatim returned 503, retrying in 2 seconds... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return makeNominatimRequest(url, retries - 1);
    }

    return response;
  } catch (error) {
    console.error('Network error making Nominatim request:', error);
    throw error;
  }
}

// Search result cache (5 minutes normal, but keep stale results for fallback)
const searchCache = new Map<string, { results: SearchResult[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const STALE_CACHE_DURATION = 60 * 60 * 1000; // 1 hour for stale fallback

// Clean up very old cache entries periodically
function cleanStaleCache() {
  const now = Date.now();
  for (const [key, value] of searchCache.entries()) {
    if (now - value.timestamp > STALE_CACHE_DURATION) {
      searchCache.delete(key);
    }
  }
}

// Run cleanup every 10 minutes
setInterval(cleanStaleCache, 10 * 60 * 1000);

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

// Calculate bounding box for a given radius in miles
function calculateBoundingBox(
  lat: number,
  lon: number,
  radiusMiles: number
): { minLat: number; maxLat: number; minLon: number; maxLon: number } {
  const radiusKm = radiusMiles * 1.60934;
  const latDegrees = radiusKm / 111; // 1 degree latitude ≈ 111 km
  const lonDegrees = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

  return {
    minLat: lat - latDegrees,
    maxLat: lat + latDegrees,
    minLon: lon - lonDegrees,
    maxLon: lon + lonDegrees,
  };
}

// Search locations with OpenStreetMap Nominatim API
export async function searchLocation(
  query: string,
  userPosition?: { latitude: number; longitude: number },
  options?: { global?: boolean; radiusMiles?: number }
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const global = options?.global ?? false;
  const radiusMiles = options?.radiusMiles ?? 100;

  // Check cache first (include global flag in cache key)
  const cacheKey = `${query.toLowerCase()}_${global ? 'global' : `local_${radiusMiles}`}`;
  const cached = searchCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`Using fresh cached ${global ? 'global' : 'local'} search results for:`, query);
    return cached.results;
  }

  // Check if we have stale cache that we can use as fallback
  const hasStaleCache = cached && Date.now() - cached.timestamp < STALE_CACHE_DURATION;

  try {
    let url = `https://nominatim.openstreetmap.org/search?` +
      `format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1`;

    // Add geographic restriction for local search
    if (!global && userPosition) {
      const bbox = calculateBoundingBox(userPosition.latitude, userPosition.longitude, radiusMiles);
      url += `&viewbox=${bbox.minLon},${bbox.maxLat},${bbox.maxLon},${bbox.minLat}&bounded=1`;
      console.log(`Local search within ${radiusMiles} miles of user location`);
    } else {
      console.log('Global search - no geographic restriction');
    }

    const response = await makeNominatimRequest(url);

    if (!response.ok) {
      console.error(`Nominatim API error: ${response.status} ${response.statusText}`);

      // If we have stale cache, use it as fallback for 503 errors
      if (response.status === 503 && hasStaleCache) {
        console.log('API unavailable (503), using stale cached results for:', query);
        return cached!.results;
      }

      throw new Error(`Failed to search locations: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Cache the results
    searchCache.set(cacheKey, { results: data, timestamp: Date.now() });

    return data;
  } catch (error) {
    console.error('Search location error:', error);

    // If we have stale cache, use it as fallback for any error
    if (hasStaleCache) {
      console.log('Error occurred, using stale cached results for:', query);
      return cached!.results;
    }

    throw new Error("Failed to search locations");
  }
}

// Reverse geocode coordinates to address
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string> {
  try {
    const response = await makeNominatimRequest(
      `https://nominatim.openstreetmap.org/reverse?` +
      `format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
    );

    if (!response.ok) {
      console.error(`Nominatim reverse geocode error: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to reverse geocode: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const addr = data.address;

    if (!addr) {
      return data.display_name || "Current Location";
    }

    // Use the smart formatting function
    return formatAddressFromComponents(data.display_name, addr);
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return "Unknown location";
  }
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
