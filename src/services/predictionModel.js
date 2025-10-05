import { getHistoricalData, storePredictions, getStoredPredictions, fetchAirQualityData } from './api';

// Cache for consistent predictions
let predictionCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const predictAQI = async (lat, lng, weeks = 10) => {
  try {
    // Check cache first
    const cacheKey = `${lat}-${lng}-${weeks}`;
    if (predictionCache && 
        predictionCache.key === cacheKey && 
        Date.now() - cacheTimestamp < CACHE_DURATION) {
      return predictionCache.data;
    }

    // Get CURRENT air quality data first
    const currentAirQuality = await fetchAirQualityData(lat, lng);
    const currentAQI = currentAirQuality?.aqi || 50;
    
    // Get historical data for trend analysis
    const historicalData = await getHistoricalData(lat, lng, 90);
    
    if (historicalData.length < 7) {
      const defaultPreds = generateDefaultPredictions(weeks, lat, lng, currentAQI);
      predictionCache = { key: cacheKey, data: defaultPreds };
      cacheTimestamp = Date.now();
      await storePredictions(defaultPreds);
      return defaultPreds;
    }

    const weeklyAverages = calculateWeeklyAverages(historicalData);
    const predictions = generateStablePredictions(weeklyAverages, weeks, lat, lng, currentAQI);

    // Validate predictions to ensure Week 1 is close to current AQI
    const validatedPredictions = validatePredictions(currentAQI, predictions);
    
    predictionCache = { key: cacheKey, data: validatedPredictions };
    cacheTimestamp = Date.now();
    await storePredictions(validatedPredictions);
    
    return validatedPredictions;
  } catch (error) {
    console.error('Prediction error:', error);
    
    // Try cached predictions first
    if (predictionCache) {
      return predictionCache.data;
    }
    
    // Then try stored predictions
    const storedPredictions = await getStoredPredictions();
    if (storedPredictions.length > 0) {
      return storedPredictions;
    }
    
    // Get current AQI for fallback predictions
    let currentAQI = 50;
    try {
      const currentAirQuality = await fetchAirQualityData(lat, lng);
      currentAQI = currentAirQuality?.aqi || 50;
    } catch (e) {
      console.error('Failed to get current AQI for fallback:', e);
    }
    
    // Finally generate stable default predictions starting from current AQI
    const defaultPreds = generateDefaultPredictions(weeks || 10, lat, lng, currentAQI);
    return defaultPreds;
  }
};

const generateStablePredictions = (weeklyAverages, weeks, lat, lng, currentAQI) => {
  const predictions = [];
  const recentWeeks = weeklyAverages.slice(0, 8);
  const trend = calculateWeeklyTrend(recentWeeks);
  
  // Use deterministic seed based on location and current date
  const seed = generateSeed(lat, lng);
  const random = createSeededRandom(seed);
  
  // Start from CURRENT AQI, not historical data
  let lastWeeklyAQI = currentAQI;
  
  // Week 1 should be very close to current AQI
  for (let i = 0; i < weeks; i++) {
    const seasonalFactor = calculateSeasonalFactor(i);
    
    // Much smaller random variation for Week 1
    const randomVariation = i === 0 ? 
      (random() * 4 - 2) : // ±2 for Week 1
      (random() * 8 - 4);  // ±4 for other weeks
    
    // Trend effect should be minimal for Week 1
    const trendStrength = i === 0 ? 0.3 : Math.max(0.1, 1 - (i * 0.1));
    const trendEffect = trend * trendStrength;
    
    const predictedWeeklyAQI = Math.max(10, Math.min(500,
      lastWeeklyAQI + trendEffect + seasonalFactor + randomVariation
    ));
    
    const currentTrend = Math.abs(predictedWeeklyAQI - lastWeeklyAQI) < 2 ? 'stable' :
                        predictedWeeklyAQI > lastWeeklyAQI ? 'increasing' : 'decreasing';
    
    predictions.push({
      week: i + 1,
      aqi: Math.round(predictedWeeklyAQI),
      confidence: Math.max(0.3, 0.9 - (i * 0.08)), // Higher confidence for Week 1
      startDate: new Date(Date.now() + (i * 7 + 1) * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + ((i + 1) * 7) * 24 * 60 * 60 * 1000),
      trend: currentTrend
    });
    
    lastWeeklyAQI = predictedWeeklyAQI;
  }
  
  return predictions;
};

// Generate seed based on location and current date (resets daily)
const generateSeed = (lat, lng) => {
  const today = new Date().toDateString(); // Changes daily
  return `${lat}-${lng}-${today}`;
};

// Seeded random number generator for consistent results
const createSeededRandom = (seed) => {
  let value = 0;
  for (let i = 0; i < seed.length; i++) {
    value = ((value << 5) - value) + seed.charCodeAt(i);
    value = value & value;
  }
  value = Math.abs(value);
  
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
};

const generateDefaultPredictions = (weeks, lat, lng, currentAQI) => {
  // Use seeded random for consistent default predictions
  const seed = generateSeed(lat, lng);
  const random = createSeededRandom(seed);
  
  // Use current AQI as base instead of random base
  const baseAQI = currentAQI;
  
  return Array.from({ length: weeks }, (_, i) => {
    let trend;
    
    // Week 1 should be very close to current AQI
    const variation = i === 0 ? 
      (random() * 10 - 5) : // ±5 for Week 1
      (random() * 20 - 10); // ±10 for other weeks
    
    const predictedAQI = Math.max(10, Math.min(300, baseAQI + variation));
    
    // Determine trend based on small changes
    if (i === 0) {
      trend = Math.abs(variation) < 3 ? 'stable' : 
              variation > 0 ? 'slightly increasing' : 'slightly decreasing';
    } else {
      const rand = random();
      trend = rand > 0.6 ? 'increasing' : rand > 0.3 ? 'decreasing' : 'stable';
    }
    
    return {
      week: i + 1,
      aqi: Math.round(predictedAQI),
      confidence: i === 0 ? 0.85 : Math.max(0.3, 0.8 - (i * 0.06)),
      startDate: new Date(Date.now() + (i * 7 + 1) * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + ((i + 1) * 7) * 24 * 60 * 60 * 1000),
      trend: trend
    };
  });
};

// Keep your existing helper functions but improve trend calculation
const calculateWeeklyAverages = (dailyData) => {
  const weeklyAverages = [];
  
  for (let i = 0; i < dailyData.length; i += 7) {
    const weekData = dailyData.slice(i, i + 7);
    if (weekData.length > 0) {
      const avgAQI = weekData.reduce((sum, day) => sum + day.aqi, 0) / weekData.length;
      weeklyAverages.push({
        week: Math.floor(i / 7) + 1,
        avgAQI: avgAQI,
        dataPoints: weekData.length
      });
    }
  }
  
  return weeklyAverages;
};

const calculateWeeklyTrend = (weeklyData) => {
  if (weeklyData.length < 3) return 0;
  
  // Use only recent weeks for more relevant trend
  const recentWeeks = weeklyData.slice(-4); // Last 4 weeks only
  
  const firstWeek = recentWeeks[0].avgAQI;
  const lastWeek = recentWeeks[recentWeeks.length - 1].avgAQI;
  const simpleTrend = (lastWeek - firstWeek) / (recentWeeks.length - 1);
  
  // More conservative trend calculation
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  
  recentWeeks.forEach((week, index) => {
    sumX += index;
    sumY += week.avgAQI;
    sumXY += index * week.avgAQI;
    sumXX += index * index;
  });
  
  const n = recentWeeks.length;
  const regressionSlope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  
  // Average both methods and be very conservative
  const combinedTrend = (simpleTrend + regressionSlope) / 2;
  
  // Only return significant trends and scale them down
  return Math.abs(combinedTrend) > 1 ? combinedTrend * 0.2 : 0;
};

const calculateSeasonalFactor = (weekIndex) => {
  const currentMonth = new Date().getMonth();
  const predictionMonth = (currentMonth + Math.floor(weekIndex / 4.345)) % 12;
  
  // More subtle seasonal factors
  const seasonalBase = {
    11: 2, 0: 2, 1: 2,   // Winter - small increase
    5: 1, 6: 1, 7: 1,    // Summer - very small increase
    2: -1, 3: -1, 4: -1, // Spring - small decrease
    8: 0, 9: 0, 10: 0    // Fall - neutral
  };
  
  return seasonalBase[predictionMonth] || 0;
};

// New function to ensure Week 1 is close to current AQI
const validatePredictions = (currentAQI, predictions) => {
  if (!predictions || predictions.length === 0) return predictions;
  
  const week1Prediction = predictions[0].aqi;
  const difference = Math.abs(week1Prediction - currentAQI);
  
  // If Week 1 is too different from current AQI, adjust it
  if (difference > 15) {
    console.log(`Adjusting Week 1 prediction: ${week1Prediction} -> closer to ${currentAQI} (current: ${currentAQI})`);
    
    const adjustedPredictions = [...predictions];
    const adjustment = currentAQI - week1Prediction;
    
    // Adjust Week 1 to be much closer to current AQI
    adjustedPredictions[0] = {
      ...adjustedPredictions[0],
      aqi: Math.round(currentAQI + (adjustment * 0.2)), // Only 20% of the difference
      trend: Math.abs(adjustment * 0.2) < 2 ? 'stable' : 
             adjustment > 0 ? 'slightly increasing' : 'slightly decreasing'
    };
    
    // Slightly adjust subsequent weeks
    for (let i = 1; i < Math.min(3, adjustedPredictions.length); i++) {
      adjustedPredictions[i] = {
        ...adjustedPredictions[i],
        aqi: Math.round(adjustedPredictions[i].aqi + (adjustment * 0.1)) // 10% of the difference
      };
    }
    
    return adjustedPredictions;
  }
  
  return predictions;
};

export const shouldAlert = (currentAQI, threshold = 100) => {
  return currentAQI >= threshold;
};

// Clear cache function
export const clearPredictionCache = () => {
  predictionCache = null;
  cacheTimestamp = null;
};