import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Switch,
  List,
  Divider,
  Button,
  Text,
  RadioButton,
} from 'react-native-paper';

export default function SettingsScreen({ theme, toggleTheme }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false); // Default to false for Expo Go
  const [healthTipsEnabled, setHealthTipsEnabled] = useState(false); // Default to false for Expo Go
  const [aqiThreshold, setAqiThreshold] = useState(100);
  const [locationEnabled, setLocationEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    // For Expo Go, disable notifications by default
    setNotificationsEnabled(false);
    setHealthTipsEnabled(false);
    setAqiThreshold(100);
    setLocationEnabled(true);
  };

  const saveSettings = () => {
    if (notificationsEnabled || healthTipsEnabled) {
      Alert.alert(
        'Expo Go Limitation',
        'Push notifications are not available in Expo Go. Please use a development build for full notification functionality.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Success', 'Settings saved successfully!');
    }
  };

  const testNotification = async () => {
    Alert.alert(
      'Expo Go Limitation',
      'Push notifications are not available in Expo Go. Please use a development build to test notifications.',
      [{ text: 'OK' }]
    );
  };

  const handleNotificationToggle = (value) => {
    if (value) {
      Alert.alert(
        'Expo Go Limitation',
        'Push notifications are not available in Expo Go. Please use a development build for notification functionality.',
        [
          { text: 'Cancel', onPress: () => setNotificationsEnabled(false), style: 'cancel' },
          { text: 'OK', onPress: () => setNotificationsEnabled(false) }
        ]
      );
    } else {
      setNotificationsEnabled(false);
    }
  };

  const handleHealthTipsToggle = (value) => {
    if (value) {
      Alert.alert(
        'Expo Go Limitation',
        'Scheduled notifications are not available in Expo Go. Please use a development build for this functionality.',
        [
          { text: 'Cancel', onPress: () => setHealthTipsEnabled(false), style: 'cancel' },
          { text: 'OK', onPress: () => setHealthTipsEnabled(false) }
        ]
      );
    } else {
      setHealthTipsEnabled(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Notification Settings</Title>
          <List.Item
            title="Enable Notifications"
            description="Receive alerts for poor air quality"
            right={() => (
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
              />
            )}
          />
          <Divider />
          <List.Item
            title="Health Tips"
            description="Daily health recommendations"
            right={() => (
              <Switch
                value={healthTipsEnabled}
                onValueChange={handleHealthTipsToggle}
              />
            )}
          />
          <Divider />
          <List.Item
            title="AQI Alert Threshold"
            description="Receive alerts when AQI exceeds this level"
            descriptionNumberOfLines={2}
          />
          <View style={styles.radioGroup}>
            <RadioButton.Group onValueChange={value => setAqiThreshold(value)} value={aqiThreshold}>
              <View style={styles.radioItem}>
                <Text>Moderate (AQI 51+)</Text>
                <RadioButton value={51} />
              </View>
              <View style={styles.radioItem}>
                <Text>Unhealthy for Sensitive (AQI 101+)</Text>
                <RadioButton value={101} />
              </View>
              <View style={styles.radioItem}>
                <Text>Unhealthy (AQI 151+)</Text>
                <RadioButton value={151} />
              </View>
              <View style={styles.radioItem}>
                <Text>Very Unhealthy (AQI 201+)</Text>
                <RadioButton value={201} />
              </View>
            </RadioButton.Group>
          </View>
          <Paragraph style={styles.note}>
            Note: Notifications require a development build in Expo.
          </Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Appearance</Title>
          <List.Item
            title="Dark Mode"
            description="Switch between light and dark theme"
            right={() => (
              <Switch
                value={theme === 'dark'}
                onValueChange={toggleTheme}
              />
            )}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Location Services</Title>
          <List.Item
            title="Use Location"
            description="Automatically detect your location for air quality data"
            right={() => (
              <Switch
                value={locationEnabled}
                onValueChange={setLocationEnabled}
              />
            )}
          />
          <Paragraph style={styles.note}>
            Location access is required for accurate local air quality information.
          </Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>App Information</Title>
          <List.Item
            title="Version"
            description="1.0.0"
            left={props => <List.Icon {...props} icon="information" />}
          />
          <Divider />
          <List.Item
            title="Data Source"
            description="OpenAQ API"
            left={props => <List.Icon {...props} icon="database" />}
          />
          <Divider />
          <List.Item
            title="Privacy Policy"
            left={props => <List.Icon {...props} icon="shield-account" />}
            onPress={() => Alert.alert('Privacy Policy', 'Your data is stored locally and never shared with third parties.')}
          />
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        
        <Button 
          mode="contained" 
          onPress={saveSettings}
          style={styles.button}
        >
          Save Settings
        </Button>
      </View>

      <View style={styles.footer}>
        <Paragraph style={styles.footerText}>
          Air Quality Monitor v1.0.0{"\n"}
          Providing real-time air quality information to help you breathe easier.
        </Paragraph>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 10,
    elevation: 4,
  },
  radioGroup: {
    marginTop: 10,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  note: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
    fontStyle: 'italic',
  },
  buttonContainer: {
    padding: 10,
  },
  button: {
    marginVertical: 5,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
    color: '#666',
    lineHeight: 20,
  },
});