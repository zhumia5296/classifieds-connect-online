// Location utilities for geolocation and geocoding

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface LocationInfo {
  coords: LocationCoords;
  address?: string;
  city?: string;
  country?: string;
  accuracy?: number;
}

export interface NearbyAd {
  id: string;
  title: string;
  description: string;
  price: number | null;
  currency: string;
  location: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  created_at: string;
  is_featured: boolean;
  category_name: string;
  image_url: string | null;
}

// Get user's current location using browser geolocation API
export const getCurrentLocation = (): Promise<LocationInfo> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5 * 60 * 1000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          },
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let message = 'Unable to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out';
            break;
        }
        reject(new Error(message));
      },
      options
    );
  });
};

// Geocode address to coordinates using a free service
export const geocodeAddress = async (address: string): Promise<LocationCoords | null> => {
  try {
    // Using Nominatim (OpenStreetMap) free geocoding service
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`
    );
    
    if (!response.ok) {
      throw new Error('Geocoding service unavailable');
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

// Reverse geocode coordinates to address
export const reverseGeocode = async (coords: LocationCoords): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`
    );
    
    if (!response.ok) {
      throw new Error('Reverse geocoding service unavailable');
    }
    
    const data = await response.json();
    
    if (data && data.display_name) {
      // Extract city and state/country from the address
      const addressParts = data.display_name.split(', ');
      if (addressParts.length >= 3) {
        return `${addressParts[0]}, ${addressParts[addressParts.length - 2]}`;
      }
      return data.display_name;
    }
    
    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
};

// Calculate distance between two points (Haversine formula)
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const earthRadius = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return earthRadius * c;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Format distance for display
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m away`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km away`;
  } else {
    return `${Math.round(distanceKm)}km away`;
  }
};

// Check if location is within a certain radius
export const isWithinRadius = (
  userCoords: LocationCoords,
  targetCoords: LocationCoords,
  radiusKm: number
): boolean => {
  const distance = calculateDistance(
    userCoords.latitude,
    userCoords.longitude,
    targetCoords.latitude,
    targetCoords.longitude
  );
  return distance <= radiusKm;
};

// Get location from localStorage
export const getCachedLocation = (): LocationInfo | null => {
  try {
    const cached = localStorage.getItem('user_location');
    if (cached) {
      const location = JSON.parse(cached);
      // Check if cached location is less than 1 hour old
      const oneHour = 60 * 60 * 1000;
      if (Date.now() - location.timestamp < oneHour) {
        return location.data;
      }
    }
  } catch (error) {
    console.error('Error reading cached location:', error);
  }
  return null;
};

// Save location to localStorage
export const cacheLocation = (location: LocationInfo): void => {
  try {
    const cached = {
      data: location,
      timestamp: Date.now()
    };
    localStorage.setItem('user_location', JSON.stringify(cached));
  } catch (error) {
    console.error('Error caching location:', error);
  }
};

// Get location with caching
export const getLocationWithCache = async (): Promise<LocationInfo> => {
  // Try to get cached location first
  const cached = getCachedLocation();
  if (cached) {
    return cached;
  }
  
  // Get fresh location
  const location = await getCurrentLocation();
  
  // Try to get address
  if (location.coords) {
    const address = await reverseGeocode(location.coords);
    if (address) {
      location.address = address;
    }
  }
  
  // Cache the result
  cacheLocation(location);
  
  return location;
};