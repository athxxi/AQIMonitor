import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
  Text,
  ActivityIndicator,
  Alert
} from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { Card, Title, Chip, Searchbar, Button } from 'react-native-paper';
import * as Location from 'expo-location';
import { fetchAirQualityData } from '../services/api';

const { width, height } = Dimensions.get('window');

const DEFAULT_REGION = {
  latitude: 10.5276,
  longitude: 76.2144,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

// Custom tile server for OpenStreetMap
const OSM_URL_TEMPLATE = 'https://a.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png';

export default function MapScreen() {
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [searchQuery, setSearchQuery] = useState('');
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    initializeMap();
  }, []);

  const initializeMap = async () => {
    try {
      setLoading(true);
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({});
        
        const userRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        
        setRegion(userRegion);

        const aqData = await fetchAirQualityData(
          userRegion.latitude,
          userRegion.longitude
        );
        
        if (aqData) {
          const userMarker = {
            ...aqData,
            latitude: userRegion.latitude,
            longitude: userRegion.longitude,
            id: 'user-location',
            isUserLocation: true
          };
          setMarkers([userMarker]);
          setSelectedMarker(userMarker);
        }
      } else {
        const aqData = await fetchAirQualityData(
          DEFAULT_REGION.latitude,
          DEFAULT_REGION.longitude
        );
        
        if (aqData) {
          const defaultMarker = {
            ...aqData,
            latitude: DEFAULT_REGION.latitude,
            longitude: DEFAULT_REGION.longitude,
            id: 'default-location'
          };
          setMarkers([defaultMarker]);
          setSelectedMarker(defaultMarker);
        }
      }

    } catch (error) {
      console.error('Error initializing map:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a location to search');
      return;
    }

    try {
      setSearching(true);
      
      const geocodedLocations = await Location.geocodeAsync(searchQuery);
      
      if (geocodedLocations.length === 0) {
        Alert.alert('Not Found', `No location found for "${searchQuery}"`);
        return;
      }

      const firstLocation = geocodedLocations[0];
      const newRegion = {
        latitude: firstLocation.latitude,
        longitude: firstLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      setRegion(newRegion);

      const aqData = await fetchAirQualityData(
        firstLocation.latitude,
        firstLocation.longitude
      );

      if (aqData) {
        const searchMarker = {
          ...aqData,
          latitude: firstLocation.latitude,
          longitude: firstLocation.longitude,
          id: `search-${Date.now()}`,
          isSearchResult: true,
          searchQuery: searchQuery
        };

        setMarkers(prev => [...prev, searchMarker]);
        setSelectedMarker(searchMarker);
        
        Alert.alert('Success', `Found air quality data for ${searchQuery}`);
      } else {
        Alert.alert('No Data', `No air quality data available for ${searchQuery}`);
      }

    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search location. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setMarkers(prev => prev.filter(marker => !marker.isSearchResult));
    setSelectedMarker(markers.find(m => m.isUserLocation) || markers[0]);
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({});
        
        const userRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        
        setRegion(userRegion);
        
        const aqData = await fetchAirQualityData(
          userRegion.latitude,
          userRegion.longitude
        );
        
        if (aqData) {
          const userMarker = {
            ...aqData,
            latitude: userRegion.latitude,
            longitude: userRegion.longitude,
            id: 'user-location',
            isUserLocation: true
          };
          
          setMarkers(prev => {
            const filtered = prev.filter(marker => marker.id !== 'user-location');
            return [userMarker, ...filtered];
          });
          
          setSelectedMarker(userMarker);
        }
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setLoading(false);
    }
  };

  const getMarkerColor = (aqi) => {
    if (!aqi) return '#666666';
    if (aqi <= 50) return '#4CAF50';
    if (aqi <= 100) return '#FFEB3B';
    if (aqi <= 150) return '#FF9800';
    if (aqi <= 200) return '#F44336';
    if (aqi <= 300) return '#9C27B0';
    return '#7B1FA2';
  };

  const getAQILevel = (aqi) => {
    if (!aqi) return 'Unknown';
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const getAQIDescription = (aqi) => {
    if (!aqi) return 'Air quality data not available';
    if (aqi <= 50) return 'Air quality is satisfactory';
    if (aqi <= 100) return 'Air quality is acceptable';
    if (aqi <= 150) return 'Members of sensitive groups may experience health effects';
    if (aqi <= 200) return 'Everyone may begin to experience health effects';
    if (aqi <= 300) return 'Health alert: everyone may experience more serious health effects';
    return 'Health warning of emergency conditions';
  };

  const handleMapReady = () => {
    setMapLoaded(true);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar with Actions */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search for location (e.g., Delhi, Mumbai, Bangalore)..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          onSubmitEditing={handleSearch}
          onIconPress={handleSearch}
          loading={searching}
        />
        <View style={styles.searchButtons}>
          <Button 
            mode="outlined" 
            onPress={getCurrentLocation}
            style={styles.locationButton}
            icon="crosshairs-gps"
            compact
          >
            Current
          </Button>
          {searchQuery ? (
            <Button 
              mode="outlined" 
              onPress={clearSearch}
              style={styles.clearButton}
              icon="close"
              compact
            >
              Clear
            </Button>
          ) : null}
        </View>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          region={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          showsScale={true}
          onMapReady={handleMapReady}
          initialRegion={DEFAULT_REGION}
        >
          {/* OpenStreetMap Tiles */}
          <UrlTile
            urlTemplate={OSM_URL_TEMPLATE}
            maximumZ={19}
            flipY={false}
          />
          
          {/* Markers */}
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              coordinate={{
                latitude: marker.latitude,
                longitude: marker.longitude
              }}
              onPress={() => setSelectedMarker(marker)}
            >
              <View style={[
                styles.markerContainer, 
                { backgroundColor: getMarkerColor(marker.aqi) },
                marker.isUserLocation && styles.userMarker,
                marker.isSearchResult && styles.searchMarker
              ]}>
                <Text style={styles.markerText}>
                  {marker.aqi || '?'}
                </Text>
              </View>
            </Marker>
          ))}
        </MapView>
        
        {!mapLoaded && (
          <View style={styles.mapOverlay}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.mapLoadingText}>Loading OpenStreetMap...</Text>
          </View>
        )}
      </View>

      {/* Selected Marker Info Card */}
      {selectedMarker && (
        <Card style={styles.markerCard}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title style={styles.cardTitle}>
                {selectedMarker.isUserLocation ? '📍 Your Location' : 
                 selectedMarker.isSearchResult ? `🔍 ${selectedMarker.searchQuery}` : 
                 'Air Quality Station'}
              </Title>
              <Button 
                mode="text" 
                onPress={() => setSelectedMarker(null)}
                style={styles.closeButton}
                compact
              >
                Close
              </Button>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>AQI:</Text>
              <Text style={[styles.infoValue, { color: getMarkerColor(selectedMarker.aqi) }]}>
                {selectedMarker.aqi || 'N/A'} - {getAQILevel(selectedMarker.aqi)}
              </Text>
            </View>
            
            <Text style={styles.description}>
              {getAQIDescription(selectedMarker.aqi)}
            </Text>
            
            {/* Pollutant Data */}
            <View style={styles.pollutantSection}>
              <Text style={styles.sectionTitle}>Pollutant Levels:</Text>
              
              {selectedMarker.pm25 !== null && selectedMarker.pm25 !== undefined && (
                <View style={styles.pollutantRow}>
                  <Text style={styles.pollutantLabel}>PM2.5:</Text>
                  <Text style={styles.pollutantValue}>{selectedMarker.pm25?.toFixed(1)} μg/m³</Text>
                </View>
              )}
              
              {selectedMarker.pm10 !== null && selectedMarker.pm10 !== undefined && (
                <View style={styles.pollutantRow}>
                  <Text style={styles.pollutantLabel}>PM10:</Text>
                  <Text style={styles.pollutantValue}>{selectedMarker.pm10?.toFixed(1)} μg/m³</Text>
                </View>
              )}
              
              {selectedMarker.no2 !== null && selectedMarker.no2 !== undefined && (
                <View style={styles.pollutantRow}>
                  <Text style={styles.pollutantLabel}>NO₂:</Text>
                  <Text style={styles.pollutantValue}>{selectedMarker.no2?.toFixed(1)} ppb</Text>
                </View>
              )}
              
              {(selectedMarker.pm25 === null || selectedMarker.pm25 === undefined) &&
               (selectedMarker.pm10 === null || selectedMarker.pm10 === undefined) &&
               (selectedMarker.no2 === null || selectedMarker.no2 === undefined) && (
                <Text style={styles.noDataText}>No detailed pollutant data available</Text>
              )}
            </View>

            {/* Location Info */}
            <View style={styles.locationSection}>
              <Text style={styles.sectionTitle}>Location:</Text>
              <Text style={styles.locationText}>
                Lat: {selectedMarker.latitude?.toFixed(4)}, Lng: {selectedMarker.longitude?.toFixed(4)}
              </Text>
              {selectedMarker.source && (
                <Text style={styles.sourceText}>
                  Source: {selectedMarker.source}
                </Text>
              )}
            </View>
          </Card.Content>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: 'white',
  },
  searchBar: {
    marginBottom: 8,
    borderRadius: 12,
    elevation: 4,
  },
  searchButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  locationButton: {
    flex: 1,
  },
  clearButton: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  mapLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  userMarker: {
    borderColor: '#2196F3',
    borderWidth: 4,
  },
  searchMarker: {
    borderColor: '#FF9800',
    borderWidth: 4,
  },
  markerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  markerCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    elevation: 8,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    flex: 1,
    marginRight: 8,
  },
  closeButton: {
    marginTop: -8,
    marginRight: -8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  pollutantSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  pollutantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pollutantLabel: {
    fontSize: 14,
    color: '#666',
  },
  pollutantValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  noDataText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  locationSection: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  sourceText: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
  },
});