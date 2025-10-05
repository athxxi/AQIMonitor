import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  List,
  Divider,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import * as Location from 'expo-location';
import { fetchAirQualityData } from '../services/api';
import { HEALTH_TIPS, AQI_CATEGORIES } from '../utils/constants';

const { width } = Dimensions.get('window');

export default function HealthScreen() {
  const [currentAQI, setCurrentAQI] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchCurrentAirQuality();
  }, []);

  const fetchCurrentAirQuality = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let location = await Location.getCurrentPositionAsync({});
      const aqData = await fetchAirQualityData(
        location.coords.latitude,
        location.coords.longitude
      );
      
      if (aqData) {
        setCurrentAQI(aqData.aqi);
      }
    } catch (error) {
      console.error('Error fetching air quality:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAQILevel = (aqi) => {
    const thresholds = Object.keys(AQI_CATEGORIES).map(Number).sort((a, b) => a - b);
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (aqi >= thresholds[i]) {
        return Object.keys(HEALTH_TIPS)[i] || 'good';
      }
    }
    return 'good';
  };

  const getHealthTips = () => {
    if (!currentAQI) return HEALTH_TIPS.good;
    
    const level = getAQILevel(currentAQI);
    return HEALTH_TIPS[level] || HEALTH_TIPS.good;
  };

  const getAllTips = () => {
    return Object.entries(HEALTH_TIPS).flatMap(([category, tips]) =>
      tips.map(tip => ({ category, tip }))
    );
  };

  const filteredTips = selectedCategory === 'all' 
    ? getAllTips()
    : getAllTips().filter(item => item.category === selectedCategory);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Paragraph>Loading health recommendations...</Paragraph>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {currentAQI !== null && (
        <Card style={styles.aqiCard}>
          
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Content>
          <Title>Recommended Health Tips</Title>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.chipContainer}
          >
            <Chip
              selected={selectedCategory === 'all'}
              onPress={() => setSelectedCategory('all')}
              style={styles.chip}
            >
              All Tips
            </Chip>
            {Object.keys(HEALTH_TIPS).map(category => (
              <Chip
                key={category}
                selected={selectedCategory === category}
                onPress={() => setSelectedCategory(category)}
                style={styles.chip}
              >
                {category.replace('_', ' ').toUpperCase()}
              </Chip>
            ))}
          </ScrollView>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Health Recommendations</Title>
          <List.Section>
            {filteredTips.map((item, index) => (
              <View key={index}>
                <List.Item
                  title={item.tip}
                  titleNumberOfLines={3}
                  left={props => <List.Icon {...props} icon="heart" />}
                  description={item.category.replace('_', ' ').toUpperCase()}
                />
                {index < filteredTips.length - 1 && <Divider />}
              </View>
            ))}
          </List.Section>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Protective Measures</Title>
          <List.Section>
            <List.Item
              title="Use N95 Masks"
              description="Effective for filtering PM2.5 particles during high pollution"
              left={props => <List.Icon {...props} icon="account-alert" />}
            />
            <Divider />
            <List.Item
              title="Air Purifiers"
              description="HEPA filters can significantly improve indoor air quality"
              left={props => <List.Icon {...props} icon="air-filter" />}
            />
            <Divider />
            <List.Item
              title="Stay Hydrated"
              description="Helps your body flush out toxins more effectively"
              left={props => <List.Icon {...props} icon="cup-water" />}
            />
            <Divider />
            <List.Item
              title="Monitor AQI Regularly"
              description="Check air quality before planning outdoor activities"
              left={props => <List.Icon {...props} icon="chart-line" />}
            />
          </List.Section>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Vulnerable Groups</Title>
          <Paragraph>
            • Children and infants{"\n"}
            • Elderly individuals{"\n"}
            • People with respiratory conditions (asthma, COPD){"\n"}
            • People with heart conditions{"\n"}
            • Pregnant women{"\n"}
            • Outdoor workers
          </Paragraph>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  aqiCard: {
    margin: 10,
    backgroundColor: '#2196F3',
  },
  aqiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  card: {
    margin: 10,
    elevation: 4,
  },
  chipContainer: {
    marginVertical: 10,
  },
  chip: {
    marginRight: 8,
  },
});