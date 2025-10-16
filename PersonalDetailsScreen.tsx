import React, { useState } from "react";
import { supabase } from "./App";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

const PersonalDetailsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [weight, setWeight] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "Other", value: "Other" },
  ]);

  const calculateProgress = () => {
    let filledFields = 0;
    const totalFields = 6;
    if (name) filledFields++;
    if (surname) filledFields++;
    if (age) filledFields++;
    if (gender) filledFields++;
    if (weight) filledFields++;
    if (phoneNumber) filledFields++;
    return (filledFields / totalFields) * 100;
  };

  const isValidPhone = (phone: string) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  };

  const handleSave = async () => {
    if (!name || !surname || !age || !gender || !weight || !phoneNumber) {
      setErrorMessage("Please fill in all required fields");
      setSuccessMessage("");
      return;
    }

    if (!isValidPhone(phoneNumber)) {
      setErrorMessage("Please enter a valid 10-digit mobile number starting with 6-9");
      setSuccessMessage("");
      return;
    }

    try {
      setLoading(true);
      console.log("💾 Saving personal details...");

      const { data: user, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        setErrorMessage("User not found!");
        return;
      }

      const userId = user.user.id;

      const { data, error } = await supabase
        .from("user_details")
        .insert([
          {
            user_id: userId,
            name,
            surname,
            age: parseInt(age),
            gender,
            weight: parseInt(weight),
            phone_num: phoneNumber.replace(/\D/g, ''), // Store clean digits only
          },
        ])
        .select();

      console.log("Supabase Response:", { data, error });

      if (error) {
        console.error("Error saving details:", error);
        setErrorMessage("Failed to save details: " + error.message);
        return;
      }

      setSuccessMessage("Details saved successfully! Welcome to DocAssist!");
      setErrorMessage("");

      // Navigate to Home after successful save
      setTimeout(() => {
        console.log("🏠 Navigating to Home...");
        navigation.navigate("Home");
      }, 2000);

    } catch (error) {
      console.error("❌ Error saving details:", error);
      setErrorMessage("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complete Your Profile</Text>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${calculateProgress()}%` }]} />
      </View>
      <Text style={styles.progressText}>{Math.round(calculateProgress())}% Completed</Text>

      {(errorMessage || successMessage) && (
        <View style={[styles.messageBox, errorMessage ? styles.errorMessageBox : styles.successMessageBox]}>
          <Text style={[styles.messageText, { color: errorMessage ? "#ff0000" : "#00aa00" }]}>
            {errorMessage || successMessage}
          </Text>
        </View>
      )}

      <TextInput
        placeholder="Name"
        placeholderTextColor="#000"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <TextInput
        placeholder="Surname"
        placeholderTextColor="#000"
        style={styles.input}
        value={surname}
        onChangeText={setSurname}
      />

      <TextInput
        placeholder="Age"
        placeholderTextColor="#000"
        style={styles.input}
        keyboardType="numeric"
        value={age}
        onChangeText={setAge}
      />

      <Text style={styles.label}>Gender</Text>
      <View style={styles.dropdownContainer}>
        <DropDownPicker
          open={open}
          value={gender}
          items={items}
          setOpen={setOpen}
          setValue={setGender}
          setItems={setItems}
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownMenu}
          placeholder="Select Gender"
        />
      </View>

      <TextInput
        placeholder="Weight (kg)"
        placeholderTextColor="#000"
        style={styles.input}
        keyboardType="numeric"
        value={weight}
        onChangeText={setWeight}
      />

      <TextInput
        placeholder="Mobile Number (10 digits)"
        placeholderTextColor="#000"
        style={styles.input}
        keyboardType="phone-pad"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        maxLength={10}
      />

      <TouchableOpacity
        style={[styles.saveButton, loading && styles.disabledButton]}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>
          {loading ? "Saving..." : "Save & Continue"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  progressBarContainer: {
    width: "90%",
    height: 10,
    backgroundColor: "#EEE",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#007BFF",
  },
  progressText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 15,
  },
  messageBox: {
    width: "90%",
    padding: 12,
    marginBottom: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  messageText: {
    fontWeight: "bold",
    textAlign: "center",
  },
  errorMessageBox: {
    backgroundColor: "#ffcccc",
    borderColor: "#ff0000",
    borderWidth: 1,
  },
  successMessageBox: {
    backgroundColor: "#ccffcc",
    borderColor: "#00aa00",
    borderWidth: 1,
  },
  input: {
    width: "90%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 15,
    color: "#000",
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 5,
  },
  dropdown: {
    borderColor: "#ccc",
    borderRadius: 10,
  },
  dropdownContainer: {
    width: "90%",
    marginBottom: 15,
  },
  dropdownMenu: {
    borderColor: "#ccc",
    borderRadius: 10,
  },
  saveButton: {
    width: "90%",
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default PersonalDetailsScreen;
