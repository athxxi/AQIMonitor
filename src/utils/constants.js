export const AQI_CATEGORIES = {
  0: { level: 'Good', color: '#00E400', health: 'Air quality is satisfactory' },
  51: { level: 'Moderate', color: '#FFFF00', health: 'Acceptable air quality' },
  101: { level: 'Unhealthy for Sensitive Groups', color: '#FF7E00', health: 'Members of sensitive groups may experience health effects' },
  151: { level: 'Unhealthy', color: '#FF0000', health: 'Everyone may begin to experience health effects' },
  201: { level: 'Very Unhealthy', color: '#8F3F97', health: 'Health warnings of emergency conditions' },
  301: { level: 'Hazardous', color: '#7E0023', health: 'Health alert: everyone may experience more serious health effects' }
};

export const HEALTH_TIPS = {
  good: [
    "Perfect day for outdoor activities!",
    "Great air quality for exercise and outdoor events",
    "Keep windows open for fresh air ventilation"
  ],
  moderate: [
    "Generally acceptable for most activities",
    "Unusually sensitive people should consider reducing prolonged outdoor exertion",
    "Good day for light outdoor activities"
  ],
  unhealthy_sensitive: [
    "Sensitive groups should reduce outdoor activities",
    "People with heart or lung disease, older adults, and children should limit prolonged exertion",
    "Consider wearing a mask if you have respiratory issues"
  ],
  unhealthy: [
    "Everyone should reduce outdoor activities",
    "Avoid prolonged exertion outdoors",
    "Keep windows closed and use air purifiers",
    "Sensitive groups should avoid outdoor activities"
  ],
  very_unhealthy: [
    "Avoid all outdoor activities",
    "Stay indoors with windows closed",
    "Use air purifiers with HEPA filters",
    "Wear N95 masks if going outside is necessary"
  ],
  hazardous: [
    "Remain indoors and keep activity levels low",
    "Use high-efficiency air purifiers",
    "Follow emergency instructions from local authorities",
    "Avoid any outdoor exposure"
  ]
};

export const POLLUTANTS = {
  pm25: 'PM2.5',
  pm10: 'PM10',
  no2: 'Nitrogen Dioxide',
  o3: 'Ozone',
  so2: 'Sulfur Dioxide',
  co: 'Carbon Monoxide'
};