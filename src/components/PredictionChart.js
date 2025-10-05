import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Card, Title, Paragraph } from 'react-native-paper';
import { AQI_CATEGORIES } from '../utils/constants';

const { width } = Dimensions.get('window');

export const PredictionChart = ({ predictions }) => {
  if (!predictions || predictions.length === 0) {
    return <Paragraph>No prediction data available</Paragraph>;
  }

  // Show only every 2nd week label to avoid overcrowding
  const labels = predictions.map((p, index) => 
    (index % 2 === 0 || index === predictions.length - 1) ? `W${p.week}` : ''
  );

  const data = {
    labels: labels,
    datasets: [
      {
        data: predictions.map(p => p.aqi),
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '3',
      strokeWidth: '2',
      stroke: '#2196F3',
    },
    propsForLabels: {
      fontSize: 10,
    },
  };

  return (
    <View style={styles.container}>
      <LineChart
        data={data}
        width={width - 40}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withVerticalLines={false}
        segments={5}
      />
      
      <View style={styles.summary}>
        <Paragraph style={styles.summaryText}>
          {predictions.length}-week forecast • {
            predictions.filter(p => p.trend === 'increasing').length
          } increasing • {
            predictions.filter(p => p.trend === 'decreasing').length
          } decreasing • Avg confidence: {
            Math.round(predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length * 100)
          }%
        </Paragraph>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  summary: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  summaryText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});