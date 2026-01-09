import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from './App';
import DropDownPicker from 'react-native-dropdown-picker';

const UserDetailsScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);
  
  // Form fields matching your database table
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState('');
  const [phoneNum, setPhoneNum] = useState('');

  // Dropdown states
  const [genderOpen, setGenderOpen] = useState(false);
  const [genderItems, setGenderItems] = useState([
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' },
  ]);

  // ✅ CHECK IF USER ALREADY HAS DETAILS
  useEffect(() => {
    const checkIfUserHasDetails = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('user_details')
            .select('uid')
            .eq('user_id', user.id)
            .maybeSingle();

          if (data) {
            // User already has details - go to HomePage
            console.log('✅ User already has details - redirecting to HomePage');
            navigation.replace('HomePage');
          } else {
            console.log('📝 New user - showing form');
          }
        }
      } catch (error) {
        console.error('Error checking user details:', error);
      } finally {
        setCheckingUser(false);
      }
    };

    checkIfUserHasDetails();
  }, []);

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async () => {
    // Validation
    if (!name || !age || !gender || !weight || !phoneNum) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!validatePhone(phoneNum)) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number starting with 6-9');
      return;
    }

    const ageNum = parseInt(age);
    const weightNum = parseInt(weight);

    if (isNaN(ageNum) || ageNum < 1 || ageNum > 150) {
      Alert.alert('Error', 'Please enter a valid age (1-150)');
      return;
    }

    if (isNaN(weightNum) || weightNum < 1 || weightNum > 500) {
      Alert.alert('Error', 'Please enter a valid weight (1-500 kg)');
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Error', 'User not found. Please login again.');
        return;
      }

      // Insert user details into database
      const { error } = await supabase
        .from('user_details')
        .insert({
          user_id: user.id,
          name: name.trim(),
          surname: surname.trim() || null,
          age: ageNum,
          gender: gender,
          weight: weightNum,
          phone_num: phoneNum,
        });

      if (error) {
        console.error('Error saving user details:', error);
        Alert.alert('Error', 'Failed to save details: ' + error.message);
      } else {
        console.log('✅ User details saved successfully');
        Alert.alert('Success', 'Profile created successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.replace('HomePage'),
          },
        ]);
      }
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while checking user
  if (checkingUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0057b3" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>Please provide your details to continue</Text>
      </View>

      <View style={styles.formContainer}>
        {/* Name */}
        <Text style={styles.label}>First Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your first name"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
          editable={!loading}
        />

        {/* Surname */}
        <Text style={styles.label}>Surname (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your surname"
          placeholderTextColor="#999"
          value={surname}
          onChangeText={setSurname}
          editable={!loading}
        />

        {/* Age */}
        <Text style={styles.label}>Age *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your age"
          placeholderTextColor="#999"
          keyboardType="number-pad"
          value={age}
          onChangeText={setAge}
          maxLength={3}
          editable={!loading}
        />

        {/* Gender */}
        <Text style={styles.label}>Gender *</Text>
        <DropDownPicker
          open={genderOpen}
          value={gender}
          items={genderItems}
          setOpen={setGenderOpen}
          setValue={setGender}
          setItems={setGenderItems}
          placeholder="Select your gender"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          disabled={loading}
          zIndex={3000}
          zIndexInverse={1000}
        />

        {/* Weight */}
        <Text style={[styles.label, { marginTop: genderOpen ? 150 : 12 }]}>Weight (kg) *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your weight in kg"
          placeholderTextColor="#999"
          keyboardType="number-pad"
          value={weight}
          onChangeText={setWeight}
          maxLength={3}
          editable={!loading}
        />

        {/* Phone Number */}
        <Text style={styles.label}>Phone Number *</Text>
        <View style={styles.phoneInputContainer}>
          <Text style={styles.phonePrefix}>+91</Text>
          <TextInput
            style={styles.phoneInput}
            placeholder="10-digit mobile number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            value={phoneNum}
            onChangeText={setPhoneNum}
            maxLength={10}
            editable={!loading}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Create Profile</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#0057b3',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#e0e0e0',
  },
  formContainer: {
    padding: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 5,
  },
  phonePrefix: {
    paddingLeft: 15,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  phoneInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  dropdown: {
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: '#fff',
    marginBottom: 5,
  },
  dropdownContainer: {
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  submitButton: {
    backgroundColor: '#0057b3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default UserDetailsScreen;
