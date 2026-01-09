import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  useColorScheme,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { supabase } from './App';

const screenWidth = Dimensions.get('window').width;

interface DoctorPortalProps {
  setIsDoctorMode?: (value: boolean) => void;
}

const DoctorPortal: React.FC<DoctorPortalProps> = ({ setIsDoctorMode }) => {
  const systemTheme = useColorScheme();
  const [theme, setTheme] = useState(systemTheme === 'dark' ? 'dark' : 'light');
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(-screenWidth))[0];
  const navigation = useNavigation<any>();

  const handleNavigation = (screen: string) => {
    navigation.navigate(screen);
  };

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
    Animated.timing(slideAnim, {
      toValue: menuVisible ? -screenWidth : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const signOut = () => {
  Alert.alert(
    'Sign Out',
    'Are you sure you want to sign out?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        onPress: () => {
          // Set doctor mode to false
          if (setIsDoctorMode) {
            setIsDoctorMode(false);
          }
          
          // Navigate back to SignIn
          setTimeout(() => {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'SignIn' }],
              })
            );
          }, 100);
        },
      },
    ]
  );
};

  const isDarkMode = theme === 'dark';
  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>DocAssist - Doctor</Text>
      </View>

      {/* Slide-out Drawer Menu */}
      {menuVisible && (
        <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
          <TouchableOpacity onPress={toggleMenu} style={styles.closeButton}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleTheme} style={styles.menuItem}>
            <Text style={styles.menuText}>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Settings Clicked')} style={styles.menuItem}>
            <Text style={styles.menuText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={signOut} style={styles.menuItem}>
            <Text style={styles.menuText}>Sign Out</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Profile feature coming soon!')} style={styles.menuItem}>
            <Text style={styles.menuText}>My Profile</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Dashboard Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.welcomeTitle}>Welcome, Dr. Mehta</Text>
        <Text style={styles.welcomeSubtitle}>Here's your dashboard</Text>

        <View style={styles.gridContainer}>
          {/* Row 1 */}
          <View style={styles.row}>
            {/* Show Appointments - Navigate to AppointmentsScreen */}
            <TouchableOpacity 
              style={styles.gridCard} 
              onPress={() => handleNavigation('AppointmentsScreen')}
            >
              <Text style={styles.cardIcon}>📅</Text>
              <Text style={styles.gridCardTitle}>Show{'\n'}Appointments</Text>
            </TouchableOpacity>

            {/* Manage Prescriptions - Shows list of patients with files */}
            <TouchableOpacity 
              style={styles.gridCard} 
              onPress={() => handleNavigation('PatientsList')}
            >
              <Text style={styles.cardIcon}>💊</Text>
              <Text style={styles.gridCardTitle}>Manage{'\n'}Prescriptions</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2 */}
          <View style={styles.row}>
            <TouchableOpacity 
              style={styles.gridCard} 
              onPress={() => Alert.alert('Analytics', 'Analytics feature coming soon!')}
            >
              <Text style={styles.cardIcon}>📊</Text>
              <Text style={styles.gridCardTitle}>View{'\n'}Analytics</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.gridCard} 
              onPress={() => Alert.alert('AI Chatbot', 'AI Chatbot feature coming soon!')}
            >
              <Text style={styles.cardIcon}>🤖</Text>
              <Text style={styles.gridCardTitle}>Enable AI{'\n'}Chatbot</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#f4f7fa',
    },
    headerBar: {
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
      color: 'white',
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
      marginBottom: 25,
    },
    gridContainer: {
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    gridCard: {
      width: '48%',
      backgroundColor: isDarkMode ? '#333' : '#fff',
      padding: 20,
      borderRadius: 12,
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
    },
    cardIcon: {
      fontSize: 40,
      marginBottom: 10,
      color: isDarkMode ? '#fff' : '#0057b3',
    },
    gridCardTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
      color: isDarkMode ? '#fff' : '#333',
    },
  });

export default DoctorPortal;
