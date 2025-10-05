import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const AIR_POLLUTION_KNOWLEDGE = {
  greetings: [
    "Hello! I'm your Air Quality Assistant. How can I help you today?",
    "Hi there! I'm here to help with air quality questions and pollution concerns.",
    "Welcome! I specialize in air pollution detection and environmental protection advice."
  ],
  pollution: [
    "Air pollution consists of harmful particles and gases in the air. Common pollutants include PM2.5, PM10, NO2, O3, SO2, and CO.",
    "PM2.5 particles are especially dangerous as they can penetrate deep into lungs and enter bloodstream.",
    "Major sources of air pollution include vehicle emissions, industrial activities, construction, and agricultural burning."
  ],
  health: [
    "Poor air quality can cause respiratory issues, heart problems, and worsen existing conditions like asthma.",
    "Children, elderly, and people with pre-existing conditions are most vulnerable to air pollution effects.",
    "Long-term exposure to polluted air can reduce life expectancy and increase cancer risk."
  ],
  solutions: [
    "Use air purifiers with HEPA filters indoors during high pollution days.",
    "Plant trees and support green spaces - they naturally filter air pollutants.",
    "Reduce vehicle use, choose public transport, biking, or walking when possible.",
    "Support renewable energy sources and energy efficiency measures.",
    "Advocate for stricter industrial emission controls in your community."
  ],
  prevention: [
    "Check air quality indexes regularly before planning outdoor activities.",
    "Wear N95 masks during high pollution days when going outside.",
    "Keep windows closed during peak pollution hours.",
    "Create a clean air room in your home with air purifying plants.",
    "Stay hydrated to help your body flush out toxins."
  ],
  default: [
    "I'm focused on air quality and pollution topics. Could you ask about pollution sources, health effects, or solutions?",
    "As an air quality assistant, I can help with pollution information, health recommendations, and environmental protection strategies.",
    "I specialize in air pollution matters. Feel free to ask about air quality indexes, pollution prevention, or health protection measures."
  ]
};

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef();

  useEffect(() => {
    // Initial greeting
    addBotMessage(getRandomResponse('greetings'));
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const getRandomResponse = (category) => {
    const responses = AIR_POLLUTION_KNOWLEDGE[category] || AIR_POLLUTION_KNOWLEDGE.default;
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const categorizeMessage = (message) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return 'greetings';
    } else if (lowerMessage.includes('pollution') || lowerMessage.includes('pollutant') || lowerMessage.includes('air quality')) {
      return 'pollution';
    } else if (lowerMessage.includes('health') || lowerMessage.includes('sick') || lowerMessage.includes('asthma') || lowerMessage.includes('lung')) {
      return 'health';
    } else if (lowerMessage.includes('solution') || lowerMessage.includes('solve') || lowerMessage.includes('fix') || lowerMessage.includes('reduce')) {
      return 'solutions';
    } else if (lowerMessage.includes('prevent') || lowerMessage.includes('protect') || lowerMessage.includes('avoid')) {
      return 'prevention';
    } else {
      return 'default';
    }
  };

  const addBotMessage = (text) => {
    const newMessage = {
      id: Date.now().toString(),
      text,
      isUser: false,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSend = () => {
    if (inputText.trim() === '') return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    
    const userInput = inputText;
    setInputText('');

    // Simulate typing delay
    setTimeout(() => {
      const category = categorizeMessage(userInput);
      const response = getRandomResponse(category);
      addBotMessage(response);
    }, 1000);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.isUser ? styles.userBubble : styles.botBubble,
            ]}
          >
            <Card
              style={[
                styles.messageCard,
                message.isUser ? styles.userCard : styles.botCard,
              ]}
            >
              <Card.Content style={styles.messageContent}>
                <Text style={[
                  styles.messageText,
                  message.isUser && styles.userMessageText
                ]}>{message.text}</Text>
                <Text style={styles.timestamp}>
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </Card.Content>
            </Card>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask about air quality, pollution, or health tips..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Ionicons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 10,
  },
  messageBubble: {
    marginVertical: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    marginLeft: 50,
  },
  botBubble: {
    alignSelf: 'flex-start',
    marginRight: 50,
  },
  messageCard: {
    maxWidth: '100%',
  },
  userCard: {
    backgroundColor: '#2196F3',
  },
  botCard: {
    backgroundColor: 'white',
  },
  messageContent: {
    padding: 8,
  },
  messageText: {
    fontSize: 16,
    color: 'black',
  },
  userMessageText: {
    color: 'white',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    backgroundColor: 'white',
  },
  sendButton: {
    backgroundColor: '#2196F3',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});