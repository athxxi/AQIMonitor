import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Initialize AsyncStorage keys
const AIR_QUALITY_KEY = 'air_quality_data';
const PREDICTIONS_KEY = 'predictions_data';
const LOCATION_CACHE_KEY = 'location_aqi_cache';

// Your OpenAQ API Key
const OPENAQ_API_KEY = "5c9cb6fc729611975adf6ed31e91b9444070fd9d4d0f6cfff6f2b047bf3e1b49";

// Cache for consistent mock data
let locationCache = new Map();

export const initDatabase = async () => {
  try {
    const existingData = await AsyncStorage.getItem(AIR_QUALITY_KEY);
    if (!existingData) {
      await AsyncStorage.setItem(AIR_QUALITY_KEY, JSON.stringify([]));
    }
    
    const existingPredictions = await AsyncStorage.getItem(PREDICTIONS_KEY);
    if (!existingPredictions) {
      await AsyncStorage.setItem(PREDICTIONS_KEY, JSON.stringify([]));
    }
    
    // Load location cache
    const cachedLocations = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
    if (cachedLocations) {
      locationCache = new Map(JSON.parse(cachedLocations));
    }
    
    console.log('Database initialized successfully with AsyncStorage');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

export const fetchAirQualityData = async (lat, lng) => {
  console.log(`Fetching OpenAQ data for coordinates: ${lat}, ${lng}`);

  // Generate cache key for this location
  const cacheKey = `${lat.toFixed(4)}-${lng.toFixed(4)}`;
  
  // Check if we have cached data for this location (valid for 1 hour)
  if (locationCache.has(cacheKey)) {
    const cached = locationCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 60 * 60 * 1000) {
      console.log('Using cached AQI data for location:', cacheKey);
      return cached.data;
    }
  }

  // Try OpenAQ API first
  const endpoints = [
    {
      name: 'locations',
      url: 'https://api.openaq.org/v3/locations',
      params: {
        coordinates: `${lat},${lng}`,
        radius: 25000,
        limit: 10,
        order_by: 'id',
        sort: 'desc'
      }
    },
    {
      name: 'latest',
      url: 'https://api.openaq.org/v3/latest',
      params: {
        coordinates: `${lat},${lng}`,
        radius: 25000,
        limit: 10
      }
    }
  ];

  for (let endpoint of endpoints) {
    try {
      console.log(`Trying OpenAQ ${endpoint.name} endpoint...`);
      
      const response = await axios.get(
        endpoint.url,
        {
          params: endpoint.params,
          headers: {
            'X-API-Key': OPENAQ_API_KEY,
            'Accept': 'application/json'
          },
          timeout: 10000
        }
      );

      console.log(`OpenAQ ${endpoint.name} response status:`, response.status);
      console.log(`OpenAQ ${endpoint.name} results count:`, response.data.results?.length);

      if (response.data && response.data.results && response.data.results.length > 0) {
        const data = processOpenAQData(endpoint.name, response.data.results, lat, lng);
        if (data) {
          await storeAirQualityData(data);
          
          // Cache the successful API data
          locationCache.set(cacheKey, {
            data: data,
            timestamp: Date.now()
          });
          await saveLocationCache();
          
          console.log(`OpenAQ ${endpoint.name} data processed successfully`);
          return data;
        }
      }
    } catch (error) {
      console.error(`Error with OpenAQ ${endpoint.name}:`, error.response?.status, error.message);
    }
  }

  console.log('All OpenAQ endpoints failed, using consistent mock data');
  const mockData = getConsistentMockAirQualityData(lat, lng);
  
  // Cache the mock data
  locationCache.set(cacheKey, {
    data: mockData,
    timestamp: Date.now()
  });
  await saveLocationCache();
  
  return mockData;
};

// Save location cache to persistent storage
const saveLocationCache = async () => {
  try {
    await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(Array.from(locationCache.entries())));
  } catch (error) {
    console.error('Error saving location cache:', error);
  }
};

// Consistent mock data based on location coordinates
const getConsistentMockAirQualityData = (lat, lng) => {
  // Use location coordinates to generate consistent values
  const locationSeed = (Math.abs(lat) * 1000 + Math.abs(lng) * 1000) % 100;
  
  // Base AQI based on location (consistent for same coordinates)
  const baseAQI = 30 + (locationSeed % 70); // AQI between 30-100
  
  // Time-based variation (changes slowly)
  const now = new Date();
  const hour = now.getHours();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  
  // Small time-based adjustments (consistent throughout the day)
  let timeAdjustment = 0;
  if (hour >= 7 && hour <= 10) timeAdjustment = 10; // Morning rush hour
  else if (hour >= 17 && hour <= 20) timeAdjustment = 8; // Evening rush hour
  else if (hour >= 22 || hour <= 5) timeAdjustment = -5; // Night - better air
  
  // Seasonal adjustment
  const seasonalAdjustment = Math.sin(dayOfYear / 58) * 5; // ±5 AQI points
  
  const finalAQI = Math.max(20, Math.min(150, 
    baseAQI + timeAdjustment + seasonalAdjustment
  ));
  
  const pm25 = finalAQI / 2; // Rough conversion from AQI to PM2.5
  
  return {
    latitude: lat,
    longitude: lng,
    pm25: parseFloat(pm25.toFixed(1)),
    pm10: parseFloat((pm25 * 1.3).toFixed(1)),
    no2: parseFloat((15 + locationSeed % 25).toFixed(1)),
    o3: parseFloat((20 + locationSeed % 20).toFixed(1)),
    so2: parseFloat((2 + locationSeed % 4).toFixed(1)),
    co: parseFloat((0.3 + (locationSeed % 7) / 10).toFixed(1)),
    aqi: Math.round(finalAQI),
    location: 'Local Station',
    city: getCityName(lat, lng),
    country: 'Local',
    timestamp: new Date().toISOString(),
    source: 'Consistent Mock Data (OpenAQ Unavailable)',
    isMock: true
  };
};

// Get approximate city name based on coordinates
const getCityName = (lat, lng) => {
  // Simple coordinate-based city detection
  if (lat >= 28.4 && lat <= 28.9 && lng >= 76.8 && lng <= 77.4) return 'Delhi';
  if (lat >= 18.9 && lat <= 19.3 && lng >= 72.7 && lng <= 72.9) return 'Mumbai';
  if (lat >= 12.9 && lat <= 13.2 && lng >= 77.4 && lng <= 77.8) return 'Bangalore';
  if (lat >= 13.0 && lat <= 13.2 && lng >= 80.2 && lng <= 80.4) return 'Chennai';
  if (lat >= 22.4 && lat <= 22.7 && lng >= 88.2 && lng <= 88.5) return 'Kolkata';
  if (lat >= 17.3 && lat <= 17.5 && lng >= 78.4 && lng <= 78.6) return 'Hyderabad';
  return 'Your Area';
};

// Clear location cache (call this on manual refresh)
export const clearLocationCache = async () => {
  locationCache.clear();
  await AsyncStorage.removeItem(LOCATION_CACHE_KEY);
  console.log('Location cache cleared');
};

// Keep the rest of your existing functions (processOpenAQData, storeAirQualityData, etc.)
const processOpenAQData = (endpointType, results, lat, lng) => {
  switch (endpointType) {
    case 'locations':
      return processLocationsData(results, lat, lng);
    case 'latest':
      return processLatestData(results, lat, lng);
    default:
      return null;
  }
};

const processLocationsData = (locations, lat, lng) => {
  const location = locations[0];
  if (!location) return null;

  const data = {
    latitude: location.coordinates?.latitude || lat,
    longitude: location.coordinates?.longitude || lng,
    pm25: null,
    pm10: null,
    no2: null,
    o3: null,
    so2: null,
    co: null,
    location: location.name || 'Unknown',
    city: location.city || 'Unknown',
    country: location.country || 'Unknown',
    timestamp: new Date().toISOString(),
    source: 'OpenAQ Locations',
    isMock: false
  };

  data.aqi = calculateAQI(data);
  return data;
};

const processLatestData = (latestResults, lat, lng) => {
  const locationData = latestResults[0];
  if (!locationData) return null;

  const data = {
    latitude: locationData.coordinates?.latitude || lat,
    longitude: locationData.coordinates?.longitude || lng,
    pm25: null,
    pm10: null,
    no2: null,
    o3: null,
    so2: null,
    co: null,
    location: locationData.location || 'Unknown',
    city: locationData.city || 'Unknown',
    country: locationData.country || 'Unknown',
    timestamp: new Date().toISOString(),
    source: 'OpenAQ Latest',
    isMock: false
  };

  if (locationData.measurements && locationData.measurements.length > 0) {
    locationData.measurements.forEach(measurement => {
      switch (measurement.parameter) {
        case 'pm25':
          data.pm25 = measurement.value;
          break;
        case 'pm10':
          data.pm10 = measurement.value;
          break;
        case 'no2':
          data.no2 = measurement.value;
          break;
        case 'o3':
          data.o3 = measurement.value;
          break;
        case 'so2':
          data.so2 = measurement.value;
          break;
        case 'co':
          data.co = measurement.value;
          break;
      }
    });
  }

  data.aqi = calculateAQI(data);
  return data;
};

// Keep your existing helper functions...
export const storeAirQualityData = async (data) => {
  try {
    const existingData = await AsyncStorage.getItem(AIR_QUALITY_KEY);
    const airQualityData = existingData ? JSON.parse(existingData) : [];
    
    airQualityData.unshift(data);
    const trimmedData = airQualityData.slice(0, 100);
    
    await AsyncStorage.setItem(AIR_QUALITY_KEY, JSON.stringify(trimmedData));
  } catch (error) {
    console.error('Error storing air quality data:', error);
  }
};

export const getHistoricalData = async (lat, lng, days = 7) => {
  try {
    const existingData = await AsyncStorage.getItem(AIR_QUALITY_KEY);
    const airQualityData = existingData ? JSON.parse(existingData) : [];
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return airQualityData.filter(item => {
      const itemDate = new Date(item.timestamp);
      return itemDate >= cutoffDate;
    });
  } catch (error) {
    console.error('Error getting historical data:', error);
    return [];
  }
};

const calculateAQI = (data) => {
  if (data.pm25 !== null) {
    return calculateAQIFromPM25(data.pm25);
  }
  if (data.pm10 !== null) {
    return calculateAQIFromPM10(data.pm10);
  }
  return 50; // Default consistent value instead of random
};

const calculateAQIFromPM25 = (pm25) => {
  if (pm25 <= 12) return Math.floor((pm25 / 12) * 50);
  else if (pm25 <= 35.4) return Math.floor(((pm25 - 12.1) / (35.4 - 12.1)) * 50 + 51);
  else if (pm25 <= 55.4) return Math.floor(((pm25 - 35.5) / (55.4 - 35.5)) * 50 + 101);
  else if (pm25 <= 150.4) return Math.floor(((pm25 - 55.5) / (150.4 - 55.5)) * 100 + 151);
  else if (pm25 <= 250.4) return Math.floor(((pm25 - 150.5) / (250.4 - 150.5)) * 100 + 201);
  else return Math.floor(((pm25 - 250.5) / (350.4 - 250.5)) * 100 + 301);
};

const calculateAQIFromPM10 = (pm10) => {
  if (pm10 <= 54) return Math.floor((pm10 / 54) * 50);
  else if (pm10 <= 154) return Math.floor(((pm10 - 55) / (154 - 55)) * 50 + 51);
  else if (pm10 <= 254) return Math.floor(((pm10 - 155) / (254 - 155)) * 50 + 101);
  else if (pm10 <= 354) return Math.floor(((pm10 - 255) / (354 - 255)) * 100 + 151);
  else if (pm10 <= 424) return Math.floor(((pm10 - 355) / (424 - 355)) * 100 + 201);
  else return Math.floor(((pm10 - 425) / (504 - 425)) * 100 + 301);
};

export const getCurrentAirQuality = async (lat, lng) => {
  try {
    const historicalData = await getHistoricalData(lat, lng, 1);
    return historicalData.length > 0 ? historicalData[0] : null;
  } catch (error) {
    console.error('Error getting current air quality:', error);
    return null;
  }
};

export const storePredictions = async (predictions) => {
  try {
    await AsyncStorage.setItem(PREDICTIONS_KEY, JSON.stringify(predictions));
  } catch (error) {
    console.error('Error storing predictions:', error);
  }
};

export const getStoredPredictions = async () => {
  try {
    const predictions = await AsyncStorage.getItem(PREDICTIONS_KEY);
    return predictions ? JSON.parse(predictions) : [];
  } catch (error) {
    console.error('Error getting predictions:', error);
    return [];
  }
};