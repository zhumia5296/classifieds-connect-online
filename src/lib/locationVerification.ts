// Location verification utilities for phone number area code validation

interface AreaCodeData {
  code: string;
  state: string;
  cities: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
}

// Sample area code data - in a real app, this would be a comprehensive database
const areaCodeDatabase: AreaCodeData[] = [
  // California
  { code: '213', state: 'CA', cities: ['Los Angeles'], coordinates: { lat: 34.0522, lng: -118.2437 } },
  { code: '310', state: 'CA', cities: ['Beverly Hills', 'Santa Monica', 'West Hollywood'], coordinates: { lat: 34.0522, lng: -118.2437 } },
  { code: '415', state: 'CA', cities: ['San Francisco'], coordinates: { lat: 37.7749, lng: -122.4194 } },
  { code: '510', state: 'CA', cities: ['Oakland', 'Berkeley'], coordinates: { lat: 37.8044, lng: -122.2711 } },
  { code: '650', state: 'CA', cities: ['Palo Alto', 'Mountain View'], coordinates: { lat: 37.4419, lng: -122.1430 } },
  
  // New York
  { code: '212', state: 'NY', cities: ['Manhattan'], coordinates: { lat: 40.7831, lng: -73.9712 } },
  { code: '347', state: 'NY', cities: ['Brooklyn', 'Bronx'], coordinates: { lat: 40.6782, lng: -73.9442 } },
  { code: '516', state: 'NY', cities: ['Long Island'], coordinates: { lat: 40.7891, lng: -73.1350 } },
  { code: '718', state: 'NY', cities: ['Brooklyn', 'Queens', 'Bronx'], coordinates: { lat: 40.6782, lng: -73.9442 } },
  
  // Texas
  { code: '214', state: 'TX', cities: ['Dallas'], coordinates: { lat: 32.7767, lng: -96.7970 } },
  { code: '281', state: 'TX', cities: ['Houston'], coordinates: { lat: 29.7604, lng: -95.3698 } },
  { code: '512', state: 'TX', cities: ['Austin'], coordinates: { lat: 30.2672, lng: -97.7431 } },
  { code: '713', state: 'TX', cities: ['Houston'], coordinates: { lat: 29.7604, lng: -95.3698 } },
  
  // Florida
  { code: '305', state: 'FL', cities: ['Miami'], coordinates: { lat: 25.7617, lng: -80.1918 } },
  { code: '407', state: 'FL', cities: ['Orlando'], coordinates: { lat: 28.5383, lng: -81.3792 } },
  { code: '813', state: 'FL', cities: ['Tampa'], coordinates: { lat: 27.9506, lng: -82.4572 } },
  { code: '954', state: 'FL', cities: ['Fort Lauderdale'], coordinates: { lat: 26.1224, lng: -80.1373 } },
  
  // Illinois
  { code: '312', state: 'IL', cities: ['Chicago'], coordinates: { lat: 41.8781, lng: -87.6298 } },
  { code: '773', state: 'IL', cities: ['Chicago'], coordinates: { lat: 41.8781, lng: -87.6298 } },
  
  // Add more area codes as needed...
];

export interface PhoneVerificationResult {
  isValid: boolean;
  areaCode: string;
  location?: {
    state: string;
    cities: string[];
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  formattedPhone: string;
  error?: string;
}

export const validatePhoneNumber = (phone: string): PhoneVerificationResult => {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check if it's a valid US phone number length
  if (cleanPhone.length !== 10 && cleanPhone.length !== 11) {
    return {
      isValid: false,
      areaCode: '',
      formattedPhone: '',
      error: 'Phone number must be 10 digits (US format)'
    };
  }
  
  // Handle 11-digit numbers (with country code)
  const phoneDigits = cleanPhone.length === 11 && cleanPhone.startsWith('1') 
    ? cleanPhone.slice(1) 
    : cleanPhone;
  
  if (phoneDigits.length !== 10) {
    return {
      isValid: false,
      areaCode: '',
      formattedPhone: '',
      error: 'Invalid phone number format'
    };
  }
  
  const areaCode = phoneDigits.slice(0, 3);
  const exchange = phoneDigits.slice(3, 6);
  const number = phoneDigits.slice(6);
  
  // Format the phone number
  const formattedPhone = `(${areaCode}) ${exchange}-${number}`;
  
  // Find area code data
  const areaCodeData = areaCodeDatabase.find(data => data.code === areaCode);
  
  if (!areaCodeData) {
    return {
      isValid: false,
      areaCode,
      formattedPhone,
      error: `Area code ${areaCode} not found in our database`
    };
  }
  
  return {
    isValid: true,
    areaCode,
    location: {
      state: areaCodeData.state,
      cities: areaCodeData.cities,
      coordinates: areaCodeData.coordinates
    },
    formattedPhone
  };
};

export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const verifyLocationMatch = (
  phoneAreaCode: string, 
  userLocation: { lat: number; lng: number } | null,
  maxDistanceMiles: number = 50
): {
  isMatch: boolean;
  distance?: number;
  message: string;
} => {
  const areaCodeData = areaCodeDatabase.find(data => data.code === phoneAreaCode);
  
  if (!areaCodeData) {
    return {
      isMatch: false,
      message: 'Area code not found in database'
    };
  }
  
  if (!userLocation) {
    return {
      isMatch: false,
      message: 'User location not provided'
    };
  }
  
  const distance = calculateDistance(
    userLocation.lat,
    userLocation.lng,
    areaCodeData.coordinates.lat,
    areaCodeData.coordinates.lng
  );
  
  const isMatch = distance <= maxDistanceMiles;
  
  return {
    isMatch,
    distance,
    message: isMatch 
      ? `Location verified: ${distance.toFixed(1)} miles from ${areaCodeData.state}`
      : `Location mismatch: ${distance.toFixed(1)} miles from expected area (${areaCodeData.state})`
  };
};

export const getSupportedAreaCodes = (): string[] => {
  return areaCodeDatabase.map(data => data.code).sort();
};

export const getAreaCodeInfo = (areaCode: string): AreaCodeData | null => {
  return areaCodeDatabase.find(data => data.code === areaCode) || null;
};