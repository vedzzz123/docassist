import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SignUpScreen from "./SignUpScreen.tsx";
import HomePage from "./HomePage.tsx";
import SelectDoctor from './SelectDoctor.tsx';
import AppointmentReceipt from './AppointmentReceipt';
import PaymentPage from "./PaymentPage.tsx";
import BookLab from "./BookLab.tsx";
import LabTests from "./LabTests.tsx";
import LabDetailsScreen from "./LabDetailsScreen.tsx";
import PrescriptionPage from './PrescriptionPage';
import PersonalDetailsScreen from './PersonalDetailsScreen.tsx';
import AppointmentsScreen from "./AppointmentsScreen.tsx";
import ManagePrescriptionsScreen from "./ManagePrescriptionsScreen.tsx";
import DoctorPage from './DoctorPortal.tsx'; 
import Articles from "./Articles.tsx";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { Session } from '@supabase/supabase-js';
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import Chatbot from "./Chatbot.tsx";
import PatientsListScreen from './PatientsListScreen';
import PatientFilesScreen from './PatientFilesScreen';
import ImageViewerScreen from './ImageViewerScreen';

import RazorpayCheckout from 'react-native-razorpay';

GoogleSignin.configure({
  webClientId: '195933112183-ju65vtarf5lmi809d3s38nv2tja4iadb.apps.googleusercontent.com',
  offlineAccess: true,
});

const supabaseUrl = 'https://uzybksfptohhqyrtoanq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6eWJrc2ZwdG9oaHF5cnRvYW5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MDkxNTMsImV4cCI6MjA1OTA4NTE1M30.dwGisDSYpZR3ekFEJ7afoiQYD54DAbeY5ddVyb9FN3o';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

const Stack = createNativeStackNavigator();

// ✅ Helper function to check if user has completed personal details
const checkUserDetailsCompletion = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("user_details")
      .select("uid")           // Primary key column name
      .eq("user_id", userId)   // Foreign key column name
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error checking user details:", error);
      return false;
    }

    return !!data; // Returns true if data exists, false otherwise
  } catch (error) {
    console.error("Error in checkUserDetailsCompletion:", error);
    return false;
  }
};

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDoctorMode, setIsDoctorMode] = useState(false); // Track doctor mode

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event, session?.user?.email);
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0057b3" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {session && session.user ? (
          <>
            <Stack.Screen name="Home" options={{ headerShown: false }}>
              {(props) => <HomePage {...props} session={session} />}
            </Stack.Screen>
            <Stack.Screen name="PrescriptionPage" options={{ title: "Prescriptions" }}>
              {(props) => <PrescriptionPage {...props} session={session} />}
            </Stack.Screen>
            <Stack.Screen name="PersonalDetails" component={PersonalDetailsScreen} options={{ title: "Complete Your Profile" }} />
            <Stack.Screen 
            name="AppointmentReceipt" 
            component={AppointmentReceipt}
            options={{ headerShown: false }}/>

            <Stack.Screen name="PaymentPage" component={PaymentPage}/>
            <Stack.Screen name="BookLab" component={BookLab}/>
            <Stack.Screen name="LabTests" component={LabTests}/>
            <Stack.Screen name="LabDetailsScreen" component={LabDetailsScreen}/>
            <Stack.Screen name="SelectDoctor" component={SelectDoctor} />
            <Stack.Screen name="Chatbot" component={Chatbot} />
            <Stack.Screen name="Articles" component={Articles} />
            <Stack.Screen name="PatientsListScreen" component={PatientsListScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PatientFilesScreen" component={PatientFilesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ImageViewerScreen" component={ImageViewerScreen} options={{ headerShown: false }} />
          </>
        ) : isDoctorMode ? (
          // Doctor mode screens
          <>
            <Stack.Screen name="DoctorPage" component={DoctorPage} options={{ headerShown: false }} />
            <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AppointmentsScreen" component={AppointmentsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ManagePrescriptionsScreen" component={ManagePrescriptionsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PatientsListScreen" component={PatientsListScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PatientFilesScreen" component={PatientFilesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ImageViewerScreen" component={ImageViewerScreen} options={{ headerShown: false }} />
</>       
        ) : (
          // Normal user screens
          <>
            <Stack.Screen name="SignIn" options={{ headerShown: false }}>
              {(props) => <SignInScreen {...props} setIsDoctorMode={setIsDoctorMode} />}
            </Stack.Screen>
            <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PersonalDetails" component={PersonalDetailsScreen} options={{ title: "Complete Your Profile" }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const SignInScreen = ({ navigation, setIsDoctorMode }: { navigation: any, setIsDoctorMode?: (value: boolean) => void }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const isValidEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    // ✅ CHECK FOR STATIC DOCTOR CREDENTIALS FIRST
    if (email === "arvindmehta123@gmail.com" && password === "arvind123") {
      try {
        setLoading(true);
        setErrorMessage("");
        
        console.log("🩺 Doctor login detected - navigating to DoctorPage");
        
        // Set doctor mode and navigate
        if (setIsDoctorMode) {
          setIsDoctorMode(true);
        }
        
        // Small delay to ensure state update
        setTimeout(() => {
          navigation.navigate("DoctorPage");
        }, 100);
        
        return; // Exit early, don't continue with normal auth
      } catch (error) {
        console.error("Error navigating to DoctorPage:", error);
        setErrorMessage("Navigation error occurred.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // ✅ CONTINUE WITH NORMAL SUPABASE AUTHENTICATION FOR ALL OTHER USERS
    try {
      setLoading(true);
      setErrorMessage("");
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data?.session) {
        console.log("✅ Email sign-in successful:", data.session.user.email);
        
        // ✅ Check if user has completed personal details
        const hasPersonalDetails = await checkUserDetailsCompletion(data.session.user.id);
        
        if (hasPersonalDetails) {
          console.log("🏠 Existing user with personal details - going to Home");
          // Session management will handle navigation to Home automatically
        } else {
          console.log("📄 New user or incomplete profile - needs personal details");
          navigation.navigate("PersonalDetails");
        }
      }
    } catch (error) {
      setErrorMessage("An unexpected error occurred.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ ENHANCED: Google sign-in with complete user flow checking
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      await GoogleSignin.signOut();
      const userInfo = await GoogleSignin.signIn();
      
      // ✅ FIXED: Safe access to user email
      const userEmail = (userInfo as any).user?.email || "No email";
      console.log("Google User Info:", userEmail);

      const { idToken } = await GoogleSignin.getTokens();
      if (!idToken) {
        throw new Error("No ID token received from Google");
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });

      if (error) {
        console.error("Supabase Auth Error:", error);
        setErrorMessage("Google sign-in failed: " + error.message);
      } else if (data?.user) {
        console.log("✅ Google sign-in successful:", data.user.email);
        
        // Check if user has completed personal details
        const hasPersonalDetails = await checkUserDetailsCompletion(data.user.id);
        
        if (hasPersonalDetails) {
          console.log("🏠 Existing user with personal details - going to Home");
          // Session management will handle navigation to Home automatically
        } else {
          console.log("📄 New user or incomplete profile - needs personal details");
          setTimeout(() => {
            navigation.navigate("PersonalDetails");
          }, 1000);
        }
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("User cancelled Google sign-in");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log("Google sign-in already in progress");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log("Play services not available or outdated");
      } else {
        console.error("Google Sign-In Error:", error);
        setErrorMessage("Google sign-in error: " + (error.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSignIn = async () => {
    if (!email) {
      setErrorMessage("Please enter your email to receive a magic link.");
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      Alert.alert(
        "Check your email",
        "We've sent you a magic link to sign in.",
        [{ text: "OK" }]
      );
    } catch (error) {
      setErrorMessage("Failed to send magic link.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.signupLink}>Let's Get you in</Text>
      {loading ? <ActivityIndicator size="large" color="#007BFF" /> : null}

      {errorMessage && (
        <View style={styles.errorMessageBox}>
          <Text style={styles.messageText}>{errorMessage}</Text>
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

      <TouchableOpacity 
        style={[styles.signInButton, loading && styles.disabledButton]} 
        onPress={handleSignIn}
        disabled={loading}
      >
        <Text style={styles.signInText}>Log In</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, loading && styles.disabledButton]} 
        onPress={signInWithGoogle}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Continue with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, loading && styles.disabledButton]} 
        onPress={handleOTPSignIn}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Continue with OTP</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.disabledButton]} 
        disabled={true}
      >
        <Text style={styles.buttonText}>Continue with Yahoo</Text>
      </TouchableOpacity>

      <Text style={styles.signupText}>
        Don't have an account?
        <Text 
          style={styles.signupLink} 
          onPress={() => !loading && navigation.navigate("SignUp")}
        >
          {" "}Sign up
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
    marginBottom: 20,
    textAlign: "center",
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
  },
  signInButton: {
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
  signInText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    width: "90%",
    justifyContent: "center",
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    textAlign: "center",
  },
  iconImage: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  signupText: {
    marginTop: 15,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  signupLink: {
    color: "#1877F2",
    fontWeight: "bold",
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
  },
  errorMessageBox: {
    width: "90%",
    padding: 12,
    backgroundColor: "#ffcccc",
    borderColor: "#ff0000",
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  messageText: {
    fontWeight: "bold",
    color: "#ff0000",
  },
});

export default App;
