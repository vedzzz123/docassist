import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from "react-native";
import { supabase } from "./App";

const SignUpScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleSignUp = async () => {
    // Reset messages
    setErrorMessage("");
    setSuccessMessage("");

    // Validation
    if (!email || !password || !confirmPassword) {
      setErrorMessage("Input Fields Empty :(");
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);
      console.log("🔄 Starting signup process...");
      
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (error) {
        console.error("❌ Signup error:", error);
        setErrorMessage(error.message);
      } else if (data?.user) {
        console.log("✅ Signup successful:", data.user.email);
        setSuccessMessage("Sign-up successful! Setting up your profile...");
        
        // ✅ NAVIGATE TO PERSONAL DETAILS AFTER SUCCESSFUL SIGNUP
        setTimeout(() => {
          console.log("📄 Navigating to Personal Details...");
          navigation.navigate("PersonalDetails");
        }, 1500);
      } else {
        setErrorMessage("Signup completed but no user data returned. Please try signing in.");
      }
    } catch (error) {
      console.error("❌ Signup catch error:", error);
      setErrorMessage("An unexpected error occurred during signup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Your Account</Text>
      
      {loading && <ActivityIndicator size="large" color="#007BFF" style={styles.loader} />}

      {(errorMessage || successMessage) && (
        <View style={[
          styles.messageBox,
          errorMessage ? styles.errorMessageBox : styles.successMessageBox
        ]}>
          <Text style={[
            styles.messageText,
            { color: errorMessage ? "#ff0000" : "#00aa00" }
          ]}>
            {errorMessage || successMessage}
          </Text>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        editable={!loading}
      />

      <TouchableOpacity 
        style={[styles.signUpButton, loading && styles.disabledButton]} 
        onPress={handleSignUp}
        disabled={loading}
      >
        <Text style={styles.signUpText}>
          {loading ? "Creating Account..." : "Sign up"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.signInText}>
        Already have an account?{" "}
        <Text 
          style={styles.signInLink} 
          onPress={() => !loading && navigation.navigate("SignIn")}
        >
          Sign in
        </Text>
      </Text>
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
    marginBottom: 30,
    textAlign: "center",
    color: "#333",
  },
  loader: {
    marginBottom: 20,
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
    textAlign: "left",
    fontSize: 16,
  },
  signUpButton: {
    width: "90%",
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
  signUpText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  signInText: {
    marginTop: 15,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  signInLink: {
    color: "#007BFF",
    fontWeight: "bold",
  },
});

export default SignUpScreen;
