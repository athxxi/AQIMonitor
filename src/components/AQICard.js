import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';

export const AQICard = ({ aqi, category, location, pollutants }) => {
  return (
    <Card style={[styles.card, { backgroundColor: category.color }]}>
      <Card.Content style={styles.content}>
        <Title style={styles.title}>Current Air Quality</Title>
        
        <View style={styles.aqiContainer}>
          <Paragraph style={styles.aqiValue}>{aqi}</Paragraph>
          <Paragraph style={styles.aqiLabel}>AQI</Paragraph>
        </View>
        
        <View style={styles.textContainer}>
          <Paragraph style={styles.category}>{category.level}</Paragraph>
          <Paragraph style={styles.healthAdvice}>{category.health}</Paragraph>
        </View>
        
        {location && (
          <Paragraph style={styles.location}>
            📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </Paragraph>
        )}
        
        {pollutants && (
          <View style={styles.pollutants}>
            {pollutants.pm25 !== null && (
              <Paragraph style={styles.pollutant}>PM2.5: {pollutants.pm25.toFixed(1)} μg/m³</Paragraph>
            )}
            {pollutants.pm10 !== null && (
              <Paragraph style={styles.pollutant}>PM10: {pollutants.pm10.toFixed(1)} μg/m³</Paragraph>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    marginTop: 20,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  content: {
    alignItems: 'center',
    paddingVertical: 25,
    paddingHorizontal: 20,
    // Remove all height constraints
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  aqiContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    // Remove flex property
  },
  aqiValue: {
    color: 'white',
    fontSize: 72,
    fontWeight: '800',
    lineHeight: 80, // Ensure proper line height
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  aqiLabel: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    opacity: 0.9,
    marginTop: 5,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  category: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  healthAdvice: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.95,
  },
  location: {
    color: 'white',
    fontSize: 12,
    marginBottom: 10,
    opacity: 0.85,
  },
  pollutants: {
    alignItems: 'center',
  },
  pollutant: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    marginVertical: 2,
    opacity: 0.9,
  },
});