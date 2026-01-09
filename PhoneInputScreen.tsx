import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { supabase } from './App';

const PhoneInputScreen = ({ navigation }: { navigation: any }) => {
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSendOTP = async () => {
    if (phoneNumber.length < 13 || !phoneNumber.startsWith('+91')) {
      setErrorMessage('Please enter a valid 10-digit Indian phone number');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      navigation.navigate('OTPVerification', { phoneNumber });
    } catch (error: any) {
      setErrorMessage('Failed to send OTP: ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Your Phone Number</Text>
      <Text style={styles.subtitle}>We'll send you an OTP to verify</Text>

      {errorMessage && (
        <View style={styles.errorMessageBox}>
          <Text style={styles.messageText}>{errorMessage}</Text>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="+91XXXXXXXXXX"
        placeholderTextColor="#999"
        keyboardType="phone-pad"
        value={phoneNumber}
        onChangeText={(text) => {
          if (!text.startsWith('+91')) {
            setPhoneNumber('+91' + text.replace('+91', ''));
          } else {
            setPhoneNumber(text);
          }
        }}
        maxLength={13}
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.sendButton, loading && styles.disabledButton]}
        onPress={handleSendOTP}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.sendButtonText}>Send OTP</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>Back to Sign In</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
  },
  input: {
    width: '90%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 18,
    color: '#000',
    backgroundColor: '#fff',
  },
  sendButton: {
    width: '90%',
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backText: {
    color: '#007BFF',
    fontSize: 14,
    marginTop: 10,
  },
  errorMessageBox: {
    width: '90%',
    padding: 12,
    backgroundColor: '#ffcccc',
    borderColor: '#ff0000',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  messageText: {
    fontWeight: 'bold',
    color: '#ff0000',
  },
});

export default PhoneInputScreen;
