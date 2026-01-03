import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  useColorScheme,
  Image,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';
import { supabase } from './App';

const screenWidth = Dimensions.get('window').width;

interface HomePageProps {
  session: Session;
}

const HomePage: React.FC<HomePageProps> = ({ session }) => {
  const [theme, setTheme] = useState('light');
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const slideAnim = useState(new Animated.Value(-screenWidth))[0];
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const [userName, setUserName] = useState('User');
  const [arvindModalVisible, setArvindModalVisible] = useState(false);
  const [urviModalVisible, setUrviModalVisible] = useState(false);

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
            const fullName = data.surname ? `${data.name} ${data.surname}` : data.name;
            setUserName(fullName || 'User');
          }
        } catch (error) {
          console.log('Error fetching user name:', error);
          setUserName(session.user.email?.split('@')[0] || 'User');
        }
      }
    };
    fetchUserName();
  }, [session?.user?.id]);

  const handleClick = (title: string) => {
    if (title === 'My Profile') {
      (navigation as any).navigate('PersonalDetails');
    } else if (title === 'Prescriptions') {
      (navigation as any).navigate('PrescriptionPage', { session: session });
    } else if (title === 'Appointment') {
      (navigation as any).navigate('SelectDoctor');
    } else if (title === 'Lab Test') {
      (navigation as any).navigate('BookLab');
    } else if (title === 'Health Articles') {
      (navigation as any).navigate('Articles', { session: session });
    }
  };

  const openChatbot = () => {
    (navigation as any).navigate('Chatbot');
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

  const scrollToCards = () => {
    scrollViewRef.current?.scrollTo({
      y: 600,
      animated: true,
    });
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  };

  const signOut = async () => {
    try {
      console.log('🚪 Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        Alert.alert('Sign Out Error', error.message);
        return;
      }
      await AsyncStorage.removeItem('user');
      console.log('✅ Successfully signed out');
    } catch (error) {
      console.error('❌ Sign out catch error:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const isDarkMode = theme === 'dark';
  const styles = getStyles(isDarkMode);

  const quickActions = [
    { icon: '👨‍⚕️', title: 'Book Appointment' },
    { icon: '🧬', title: 'Book Lab Test' },
    { icon: '📂', title: 'Upload Prescriptions' },
    { icon: '📰', title: 'Health Articles' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>DocAssist</Text>
      </View>

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
        <TouchableOpacity onPress={() => handleClick('My Profile')} style={styles.menuItem}>
          <Text style={styles.menuText}>My Profile</Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView style={styles.content} ref={scrollViewRef} contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}>
        <Text style={styles.welcomeTitle}>Hello, {userName}!</Text>
        <Text style={styles.welcomeSubtitle}>Our Doctors:</Text>

        <View style={styles.doctorCardsContainer}>
          <TouchableOpacity
            style={styles.doctorCubeCard}
            onPress={() => setArvindModalVisible(true)}
            activeOpacity={0.9}
          >
            <Image 
              source={require('./assets/Doctor.png')}
              style={styles.doctorCubeIcon}
            />
            <Text style={styles.doctorCubeName}>Dr Arvind Mehta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.doctorCubeCard}
            onPress={() => setUrviModalVisible(true)}
            activeOpacity={0.9}
          >
            <Image 
              source={require('./assets/Doctor.png')}
              style={styles.doctorCubeIcon}
            />
            <Text style={styles.doctorCubeName}>Dr Urvi Mehta</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.helpTitle}>How can we help you today?</Text>

        <View style={styles.quickActionsContainer}>
          {quickActions.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.quickActionCard, activeIndex === index && { opacity: 0.7 }]}
              onPressIn={() => handlePressIn(index)}
              onPressOut={handlePressOut}
              onPress={() => handleClick(item.title)}
              activeOpacity={0.8}
            >
              <Text style={styles.quickActionIcon}>{item.icon}</Text>
              <Text style={styles.quickActionTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerItem} onPress={scrollToCards}>
          <Text style={styles.footerIcon}>🏠</Text>
          <Text style={styles.footerText}>Actions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerItem}>
          <Text style={styles.footerIcon}>🚨</Text>
          <Text style={styles.footerText}>Alerts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerItem} onPress={openChatbot}>
          <Text style={styles.footerIcon}>💬</Text>
          <Text style={styles.footerText}>AI Chatbot</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerItem}>
          <Text style={styles.footerIcon}>⋯</Text>
          <Text style={styles.footerText}>More</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={arvindModalVisible} transparent animationType="fade" onRequestClose={() => setArvindModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setArvindModalVisible(false)}>
            <View style={[styles.modalContainer, { backgroundColor: isDarkMode ? '#333' : '#fff' }]}>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setArvindModalVisible(false)}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
              <Image source={require('./assets/Doctor.png')} style={styles.modalDoctorImage} />
              <Text style={[styles.modalDoctorName, { color: isDarkMode ? '#fff' : '#0057b3' }]}>Dr Arvind Mehta</Text>
              <Text style={[styles.modalDoctorSpeciality, { color: isDarkMode ? '#ddd' : '#333' }]}>MBBS, MD (Internal Medicine)</Text>
              <View style={styles.modalInfoContainer}>
                <Text style={[styles.modalInfoText, { color: isDarkMode ? '#eee' : '#555' }]}>20+ years of clinical experience</Text>
                <Text style={[styles.modalInfoText, { color: isDarkMode ? '#eee' : '#555' }]}>Specializes in Internal Medicine</Text>
                <Text style={[styles.modalInfoText, { color: isDarkMode ? '#eee' : '#555' }]}>5000+ patients treated successfully</Text>
                <Text style={[styles.modalInfoText, { color: isDarkMode ? '#eee' : '#555' }]}>Available for consultations Mon-Sat</Text>
                <Text style={[styles.modalInfoText, { color: isDarkMode ? '#eee' : '#555' }]}>Emergency appointments available</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={urviModalVisible} transparent animationType="fade" onRequestClose={() => setUrviModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setUrviModalVisible(false)}>
            <View style={[styles.modalContainer, { backgroundColor: isDarkMode ? '#333' : '#fff' }]}>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setUrviModalVisible(false)}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
              <Image source={require('./assets/Doctor.png')} style={styles.modalDoctorImage} />
              <Text style={[styles.modalDoctorName, { color: isDarkMode ? '#fff' : '#0057b3' }]}>Dr Urvi Mehta</Text>
              <Text style={[styles.modalDoctorSpeciality, { color: isDarkMode ? '#ddd' : '#333' }]}>MBBS, MD (Internal Medicine)</Text>
              <View style={styles.modalInfoContainer}>
                <Text style={[styles.modalInfoText, { color: isDarkMode ? '#eee' : '#555' }]}>10+ years of clinical experience</Text>
                <Text style={[styles.modalInfoText, { color: isDarkMode ? '#eee' : '#555' }]}>Specializes in Internal Medicine</Text>
                <Text style={[styles.modalInfoText, { color: isDarkMode ? '#eee' : '#555' }]}>Focus on preventive healthcare</Text>
                <Text style={[styles.modalInfoText, { color: isDarkMode ? '#eee' : '#555' }]}>Available for consultations Tue-Sun</Text>
                <Text style={[styles.modalInfoText, { color: isDarkMode ? '#eee' : '#555' }]}>Women's health specialist</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: isDarkMode ? '#121212' : '#f4f7fa' },
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? '#222' : '#0057b3', padding: 15 },
    menuButton: { marginRight: 15 },
    menuIcon: { fontSize: 28, color: 'white' },
    headerText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    drawer: { position: 'absolute', width: '70%', height: '100%', backgroundColor: isDarkMode ? '#333' : 'white', paddingTop: 50, paddingHorizontal: 20, shadowColor: '#000', shadowOpacity: 0.3, shadowOffset: { width: 4, height: 0 }, shadowRadius: 5, elevation: 10, zIndex: 10 },
    closeButton: { position: 'absolute', top: 20, right: 20 },
    closeIcon: { fontSize: 28, color: '#0057b3' },
    menuItem: { paddingVertical: 15 },
    menuText: { fontSize: 18, color: isDarkMode ? '#f4f7fa' : '#333' },
    content: { flexGrow: 1, padding: 15 },
    welcomeTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 5, color: isDarkMode ? '#fff' : '#000' },
    welcomeSubtitle: { fontSize: 16, color: isDarkMode ? '#bbb' : '#666', marginBottom: 15 },
    doctorCardsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, paddingHorizontal: 5 },
    doctorCubeCard: { width: '48%', aspectRatio: 1, backgroundColor: isDarkMode ? '#333' : '#fff', borderRadius: 16, padding: 15, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
    doctorCubeIcon: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
    doctorCubeName: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', color: isDarkMode ? '#fff' : '#0057b3', lineHeight: 18 },
    helpTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: isDarkMode ? '#fff' : '#333' },
    quickActionsContainer: { gap: 12 },
    quickActionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? '#333' : '#fff', padding: 18, borderRadius: 12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    quickActionIcon: { fontSize: 32, marginRight: 15 },
    quickActionTitle: { fontSize: 16, fontWeight: '600', color: isDarkMode ? '#fff' : '#333', flex: 1 },
    footer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#0057b3', paddingVertical: 10, position: 'absolute', bottom: 0, width: '100%' },
    footerItem: { alignItems: 'center' },
    footerIcon: { fontSize: 22, color: '#fff' },
    footerText: { fontSize: 11, color: '#fff', marginTop: 2 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContainer: { width: '100%', maxWidth: 350, borderRadius: 20, padding: 25, elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
    modalCloseButton: { position: 'absolute', top: 15, right: 15, zIndex: 1 },
    modalCloseIcon: { fontSize: 24, color: '#666', fontWeight: 'bold' },
    modalDoctorImage: { width: 120, height: 120, borderRadius: 60, alignSelf: 'center', marginBottom: 15, borderWidth: 3, borderColor: '#0057b3' },
    modalDoctorName: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
    modalDoctorSpeciality: { fontSize: 16, textAlign: 'center', marginBottom: 20, fontWeight: '600' },
    modalInfoContainer: { gap: 12 },
    modalInfoText: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  });

export default HomePage;
