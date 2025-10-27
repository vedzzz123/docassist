import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated, Dimensions, useColorScheme } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';
import { supabase } from './App'; // Import supabase client
import { CommonActions } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;

interface HomePageProps {
  session: Session;
}

const HomePage: React.FC<HomePageProps> = ({ session }) => {
  const systemTheme = useColorScheme();
  const [theme, setTheme] = useState('light');
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const slideAnim = useState(new Animated.Value(-screenWidth))[0];
  const navigation = useNavigation<any>();
  
  // ✅ NEW: State to store user's name
  const [userName, setUserName] = useState<string>('User');

  useEffect(() => {
    const fetchStoredTheme = async () => {
      const storedTheme = await AsyncStorage.getItem('theme');
      if (storedTheme) {
        setTheme(storedTheme);
      } else {
        setTheme('light');
      }
    };
    fetchStoredTheme();
  }, []);

  // ✅ NEW: Fetch user's name from database
  useEffect(() => {
    const fetchUserName = async () => {
      if (session?.user?.id) {
        try {
          const { data, error } = await supabase
            .from('user_details')
            .select('name, surname')
            .eq('user_id', session.user.id)
            .single();

          if (data && !error) {
            // Set full name or just first name
            const fullName = data.surname ? `${data.name} ${data.surname}` : data.name;
            setUserName(fullName || 'User');
          }
        } catch (error) {
          console.log('Error fetching user name:', error);
          // Fallback to email if name not found
          setUserName(session.user.email?.split('@')[0] || 'User');
        }
      }
    };

    fetchUserName();
  }, [session?.user?.id]);

  const handleClick = (title: string | undefined) => {
    if (title === 'My Profile') {
      navigation.navigate('PersonalDetails');
    } else if (title === 'Upload Past Prescriptions') {
      navigation.navigate('PrescriptionPage', { session: session });
    } else if (title === 'Book Appointments') {
      navigation.navigate('SelectDoctor');
    } else if (title === 'Book Lab Tests') {
      navigation.navigate('BookLab');
    }  else if (title === 'AI Chatbot') {
      navigation.navigate('Chatbot');
    } else if (title === 'Health Articles') {
      navigation.navigate('Articles', { session: session });
    }
  };

  const handlePressIn = (index: number) => setActiveIndex(index);
  const handlePressOut = () => setActiveIndex(null);

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
    Animated.timing(slideAnim, {
      toValue: menuVisible ? -screenWidth : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  };

  // ✅ FIXED: Proper sign out function
  const signOut = async () => {
    try {
      console.log('🚪 Signing out...');
      
      // Sign out from Supabase (this will trigger the auth state change in App.tsx)
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        Alert.alert('Sign Out Error', error.message);
        return;
      }

      // Clear any additional local storage if needed
      await AsyncStorage.removeItem('user');
      console.log('✅ Successfully signed out');
      
      // The navigation will happen automatically via the auth state change in App.tsx
      // No need to manually navigate here
    } catch (error) {
      console.error('❌ Sign out catch error:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const isDarkMode = theme === 'dark';
  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>DocAssist</Text>
      </View>

      {/* Animated Drawer */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        <TouchableOpacity style={styles.closeButton} onPress={toggleMenu}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={toggleTheme}>
          <Text style={styles.menuText}>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Settings Clicked')}>
          <Text style={styles.menuText}>Settings</Text>
        </TouchableOpacity>

        {/* ✅ FIXED: Proper sign out button */}
        <TouchableOpacity style={styles.menuItem} onPress={signOut}>
          <Text style={styles.menuText}>Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => handleClick('My Profile')}>
          <Text style={styles.menuText}>My Profile</Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* ✅ UPDATED: Display user's actual name instead of email */}
        <Text style={styles.welcomeTitle}>Hello, {userName}!</Text>
        <Text style={styles.welcomeSubtitle}>How can we assist you today?</Text>

        <View style={styles.grid}>
          {[
            { icon: '👨‍⚕️', title: 'Book Appointments' },
            { icon: '🧬', title: 'Book Lab Tests' },
            { icon: '📂', title: 'Upload Past Prescriptions' },
            { icon: '💬', title: 'AI Chatbot' },
            { icon: '📰', title: 'Health Articles' },
          ].map((item, index) => (
            <Pressable
              key={index}
              style={[
                styles.box,
                activeIndex === index && { opacity: 0.8, transform: [{ scale: 0.95 }] },
              ]}
              onPressIn={() => handlePressIn(index)}
              onPressOut={handlePressOut}
              onPress={() => handleClick(item.title || '')}
            >
              <Text style={styles.icon}>{item.icon}</Text>
              <Text style={styles.boxTitle}>{item.title}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

// ✅ Styles remain the same
const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#f4f7fa',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#222' : '#0057b3',
      padding: 15,
    },
    menuButton: {
      marginRight: 15,
    },
    menuIcon: {
      fontSize: 28,
      color: isDarkMode ? 'white' : 'white',
    },
    headerText: {
      color: '#fff',
      fontSize: 20,
      fontWeight: 'bold',
    },
    drawer: {
      position: 'absolute',
      width: '70%',
      height: '100%',
      backgroundColor: isDarkMode ? '#333' : 'white',
      paddingTop: 50,
      paddingHorizontal: 20,
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowOffset: { width: 4, height: 0 },
      shadowRadius: 5,
      elevation: 10,
      zIndex: 10,
    },
    closeButton: {
      position: 'absolute',
      top: 20,
      right: 20,
    },
    closeIcon: {
      fontSize: 28,
      color: '#0057b3',
    },
    menuItem: {
      paddingVertical: 15,
    },
    menuText: {
      fontSize: 18,
      color: isDarkMode ? '#f4f7fa' : '#333',
    },
    content: {
      flexGrow: 1,
      padding: 15,
    },
    welcomeTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 10,
      color: isDarkMode ? '#fff' : '#000',
    },
    welcomeSubtitle: {
      fontSize: 16,
      color: isDarkMode ? '#bbb' : '#666',
      marginBottom: 20,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    box: {
      width: '48%',
      backgroundColor: isDarkMode ? '#333' : '#fff',
      padding: 20,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 15,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
    },
    // ✅ UPDATED: Full width style for Health Articles
    fullWidthBox: {
      width: '100%',
      minHeight: 120, // Makes it bigger vertically
    },
    icon: {
      fontSize: 40,
      marginBottom: 10,
      color: isDarkMode ? '#fff' : '#0057b3',
    },
    boxTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
      color: isDarkMode ? '#fff' : '#333',
    },
  });
  
export default HomePage;
