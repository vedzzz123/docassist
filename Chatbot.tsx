import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import axios from 'axios';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
};

// Replace GEMINI_API_KEY with your actual API key (just the key value, not the full URL)
const API_KEY = 'AIzaSyB5ssNM8bgfKmKyRWBjFaJYumWOKd7m_JU'; 

const Chatbot = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hello! How can I help you today?', sender: 'bot' },
  ]);
  const [inputText, setInputText] = useState('');

  const fetchBotResponse = async (userMessage: string) => {
    try {
      // Using the gemini-2.0-flash model as specified in your curl example
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
        {
          contents: [
            {
              parts: [
                { text: userMessage }
              ]
            }
          ]
        }
      );

      // Access the response based on the Gemini API structure
      const botReply = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not understand that.';

      return botReply;
    } catch (error) {
      console.error('Error fetching response:', error);
      return 'Something went wrong. Please check your API key and connection.';
    }
  };

  const handleSendMessage = async () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: (messages.length + 1).toString(),
        text: inputText,
        sender: 'user',
      };
      setMessages([...messages, newMessage]);
      setInputText('');

      // Fetch AI-generated response
      const botReply = await fetchBotResponse(inputText);

      const botResponse: Message = {
        id: (messages.length + 2).toString(),
        text: botReply,
        sender: 'bot',
      };

      setMessages((prevMessages) => [...prevMessages, botResponse]);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUserMessage = item.sender === 'user';
    return (
      <View style={[styles.message, isUserMessage ? styles.userMessage : styles.botMessage]}>
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
          placeholderTextColor="black"
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  messagesContainer: {
    paddingBottom: 80,
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  message: {
    maxWidth: '75%',
    padding: 12,
    marginVertical: 5,
    borderRadius: 15,
  },
  userMessage: {
    backgroundColor: '#00509d',
    alignSelf: 'flex-end',
  },
  botMessage: {
    backgroundColor: '#00509d',
    alignSelf: 'flex-start',
    borderColor: '#e1e1e1',
    borderWidth: 1,
  },
  messageText: {
    color: '#ffffff',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#dddddd',
    backgroundColor: '#ffffff',
  },
  input: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 20,
    backgroundColor: 'white',
    fontSize: 16,
    color: 'black',
  },
  sendButton: {
    marginLeft: 10,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'black',
  },
  sendText: {
    color: 'black',
    fontSize: 16,
  },
});

export default Chatbot;