import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,Alert } from 'react-native';
import { supabase } from './App';



const OTPVerificationScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const { phoneNumber } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleVerifyOTP = async () => {
  if (otp.length !== 6) {
    setErrorMessage('Please enter a valid 6-digit OTP');
    return;
  }

  try {
    setLoading(true);
    setErrorMessage('');

    const { data, error } = await supabase.auth.verifyOtp({
      phone: phoneNumber,
      token: otp,
      type: 'sms',
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (data?.user) {
      console.log('✅ OTP verification successful');
      
      // ✅ CHECK IF USER HAS DETAILS
      const hasDetails = await checkUserDetailsCompletion(data.user.id);
      
      if (hasDetails) {
        console.log('🏠 Existing user - navigating to HomePage');
        navigation.replace('HomePage');
      } else {
        console.log('📝 New user - navigating to UserDetails');
        navigation.replace('UserDetails');
      }
    }
  } catch (error: any) {
    setErrorMessage('Failed to verify OTP: ' + error.message);
    console.error(error);
  } finally {
    setLoading(false);
  }
};

const checkUserDetailsCompletion = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("user_details")
      .select("uid")
      .eq("user_id", userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error("Error checking user details:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Error in checkUserDetailsCompletion:", error);
    return false;
  }
};

  const handleResendOTP = async () => {
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

    setErrorMessage('');
    Alert.alert('Success', 'OTP sent successfully!');
  } catch (error: any) {
    setErrorMessage('Failed to resend OTP');
    console.error(error);
  } finally {
    setLoading(false);
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.subtitle}>Enter the 6-digit code sent to</Text>
      <Text style={styles.phoneText}>{phoneNumber}</Text>

      {errorMessage && (
        <View style={styles.errorMessageBox}>
          <Text style={styles.messageText}>{errorMessage}</Text>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Enter OTP"
        placeholderTextColor="#999"
        keyboardType="number-pad"
        value={otp}
        onChangeText={setOtp}
        maxLength={6}
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.verifyButton, loading && styles.disabledButton]}
        onPress={handleVerifyOTP}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.verifyButtonText}>Verify OTP</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResendOTP} disabled={loading}>
        <Text style={styles.resendText}>Didn't receive OTP? Resend</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>Change Phone Number</Text>
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
    marginBottom: 5,
  },
  phoneText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007BFF',
    marginBottom: 30,
  },
  input: {
    width: '90%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 24,
    letterSpacing: 5,
    textAlign: 'center',
    color: '#000',
    backgroundColor: '#fff',
  },
  verifyButton: {
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
  verifyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendText: {
    color: '#007BFF',
    fontSize: 14,
    marginBottom: 10,
  },
  backText: {
    color: '#666',
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

export default OTPVerificationScreen;
