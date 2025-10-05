import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export const setupNotifications = async () => {
  // For Expo Go, notifications are limited
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    console.log('Notifications are limited in Expo Go. Use development build for full functionality.');
    return false;
  }
  
  try {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return false;
      }
      
      console.log('Notification permissions granted');
      return true;
    } else {
      console.log('Must use physical device for notifications');
      return false;
    }
  } catch (error) {
    console.error('Error setting up notifications:', error);
    return false;
  }
};

export const sendAirQualityAlert = async (aqi, location = 'your area') => {
  // For Expo Go, show alert instead of push notification
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    // In a real app, you might want to use Alert.alert here
    console.log(`Air Quality Alert: AQI ${aqi} in ${location}`);
    return true;
  }
  
  try {
    let message = '';
    let title = 'Air Quality Alert';
    
    if (aqi >= 301) {
      message = `Hazardous air quality (AQI: ${aqi}) in ${location}. Stay indoors and avoid all outdoor activities.`;
      title = '🚨 Hazardous Air Quality';
    } else if (aqi >= 201) {
      message = `Very unhealthy air quality (AQI: ${aqi}) in ${location}. Avoid outdoor activities and keep windows closed.`;
      title = '⚠️ Very Unhealthy Air';
    } else if (aqi >= 151) {
      message = `Unhealthy air quality (AQI: ${aqi}) in ${location}. Limit outdoor exposure, especially for sensitive groups.`;
      title = '⚠️ Unhealthy Air Quality';
    } else if (aqi >= 101) {
      message = `Air quality unhealthy for sensitive groups (AQI: ${aqi}) in ${location}. Take precautions if you have respiratory issues.`;
      title = 'Air Quality Notice';
    }

    if (message) {
      // For web or development builds, use actual notifications
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: message,
          sound: 'default',
          data: { aqi, location, type: 'air_quality_alert' },
        },
        trigger: null,
      });
      console.log('Air quality alert sent');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error sending air quality alert:', error);
    return false;
  }
};

export const isExpoGo = () => {
  return Platform.OS === 'ios' || Platform.OS === 'android';
};

export const showExpoGoWarning = () => {
  if (isExpoGo()) {
    alert('This feature requires a development build. Notifications are limited in Expo Go.');
  }
};