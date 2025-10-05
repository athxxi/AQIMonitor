import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { Card, Title, Paragraph, ActivityIndicator, Button } from 'react-native-paper';
import * as Location from 'expo-location';
import { AQICard } from '../components/AQICard';
import { PredictionChart } from '../components/PredictionChart';
import { fetchAirQualityData } from '../services/api';
import { predictAQI } from '../services/predictionModel';
import { AQI_CATEGORIES } from '../utils/constants';
import { clearLocationCache } from '../services/api';

const { width } = Dimensions.get('window');

// Cache for current air quality data
let airQualityCache = null;
let airQualityCacheTimestamp = null;
const AIR_QUALITY_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export default function DashboardScreen() {
  const [location, setLocation] = useState(null);
  const [airQuality, setAirQuality] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [predictionWeeks, setPredictionWeeks] = useState(10);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      if (!location) { // Only load if we don't have location
        await getLocationAndData();
      }
    };
    loadData();
  }, []);

  const getLocationAndData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if we're on web platform
      if (Platform.OS === 'web') {
        // For web, use a default location or browser geolocation
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const coords = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              };
              await fetchDataForLocation(coords);
            },
            async (error) => {
              console.log('Geolocation error, using default location');
              // Use a default location (e.g., New York)
              const defaultCoords = { latitude: 40.7128, longitude: -74.0060 };
              await fetchDataForLocation(defaultCoords);
            }
          );
        } else {
          // Browser doesn't support geolocation
          const defaultCoords = { latitude: 40.7128, longitude: -74.0060 };
          await fetchDataForLocation(defaultCoords);
        }
      } else {
        // For mobile, use Expo Location
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied');
          // Use default location
          const defaultCoords = { latitude: 40.7128, longitude: -74.0060 };
          await fetchDataForLocation(defaultCoords);
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        };
        await fetchDataForLocation(coords);
      }
    } catch (error) {
      console.error('Error in getLocationAndData:', error);
      setError('Failed to fetch location and air quality data');
      setLoading(false);
    }
  };

 // In your fetchDataForLocation function, remove the validation call:
const fetchDataForLocation = async (coords) => {
  try {
    // Only update location if it's significantly different
    const isNewLocation = !location || 
      Math.abs(location.latitude - coords.latitude) > 0.01 ||
      Math.abs(location.longitude - coords.longitude) > 0.01;
    
    if (isNewLocation) {
      setLocation(coords);
    }

    // Check cache for air quality data
    const cacheKey = `aq-${coords.latitude}-${coords.longitude}`;
    const now = Date.now();
    
    if (airQualityCache && 
        airQualityCache.key === cacheKey && 
        now - airQualityCacheTimestamp < AIR_QUALITY_CACHE_DURATION) {
      setAirQuality(airQualityCache.data);
      setLastUpdate(new Date(airQualityCacheTimestamp));
    } else {
      const aqData = await fetchAirQualityData(coords.latitude, coords.longitude);
      setAirQuality(aqData);
      airQualityCache = { key: cacheKey, data: aqData };
      airQualityCacheTimestamp = now;
      setLastUpdate(new Date(now));
    }

    // Remove the validation call - it's now handled inside predictAQI
    const predData = await predictAQI(coords.latitude, coords.longitude, predictionWeeks);
    setPredictions(predData);
    
  } catch (error) {
    console.error('Error fetching air quality data:', error);
    setError('Failed to fetch air quality data');
    
    // Try to use cached data if available
    if (airQualityCache) {
      setAirQuality(airQualityCache.data);
    }
  } finally {
    setLoading(false);
  }
};

const onRefresh = async () => {
  setRefreshing(true);
  // Clear caches to force fresh data
  airQualityCache = null;
  airQualityCacheTimestamp = null;
  await clearLocationCache(); // This should now work
  await getLocationAndData();
  setRefreshing(false);
};

  const getAQICategory = (aqi) => {
    const thresholds = Object.keys(AQI_CATEGORIES).map(Number).sort((a, b) => a - b);
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (aqi >= thresholds[i]) {
        return AQI_CATEGORIES[thresholds[i]];
      }
    }
    return AQI_CATEGORIES[0];
  };

  const formatDateRange = (startDate, endDate) => {
    return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
  };

  const getTimeSinceUpdate = () => {
    if (!lastUpdate) return 'Just now';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - lastUpdate) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text>Loading air quality data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Button onPress={getLocationAndData} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {airQuality && (
        <>
          <AQICard 
            aqi={airQuality.aqi}
            category={getAQICategory(airQuality.aqi)}
            location={location}
            pollutants={airQuality}
            lastUpdated={getTimeSinceUpdate()}
          />
          
          <Card style={styles.card}>
            <Card.Content>
              <Title>10-Week AQI Forecast</Title>
              <PredictionChart predictions={predictions} />
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Title>Weekly Predictions</Title>
              {predictions.map((prediction, index) => (
                <View key={index} style={styles.predictionItem}>
                  <View style={styles.predictionHeader}>
                    <Text style={styles.weekText}>Week {prediction.week}</Text>
                    <Text style={[
                      styles.trendText,
                      prediction.trend === 'increasing' ? styles.trendUp :
                      prediction.trend === 'decreasing' ? styles.trendDown : styles.trendStable
                    ]}>
                      {prediction.trend}
                    </Text>
                  </View>
                  <Text style={styles.dateRange}>
                    {formatDateRange(prediction.startDate, prediction.endDate)}
                  </Text>
                  <View style={styles.predictionDetails}>
                    <Text style={styles.aqiText}>AQI: {prediction.aqi}</Text>
                    <Text style={styles.confidenceText}>
                      Confidence: {Math.round(prediction.confidence * 100)}%
                    </Text>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>

          

          <Card style={styles.card}>
            <Card.Content>
              <Title>Location Information</Title>
              <Paragraph>Latitude: {location?.latitude?.toFixed(4)}</Paragraph>
              <Paragraph>Longitude: {location?.longitude?.toFixed(4)}</Paragraph>
              <Paragraph>Last Updated: {getTimeSinceUpdate()}</Paragraph>
              <Paragraph>Data Source: {airQuality.dataSource || 'Default'}</Paragraph>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Title>Data Information</Title>
              <Paragraph>Predictions are updated daily</Paragraph>
              <Paragraph>Current AQI data is cached for 10 minutes</Paragraph>
              <Paragraph>Pull down to refresh for latest data</Paragraph>
            </Card.Content>
          </Card>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    margin: 10,
    elevation: 4,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    marginTop: 10,
  },
  predictionItem: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  weekText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  trendText: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  trendUp: {
    backgroundColor: '#ffebee',
    color: '#d32f2f',
  },
  trendDown: {
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
  },
  trendStable: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
  },
  dateRange: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  predictionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  aqiText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  confidenceText: {
    fontSize: 12,
    color: '#666',
  },
});