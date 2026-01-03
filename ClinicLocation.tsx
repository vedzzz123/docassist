import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const ClinicLocation = () => {
  const navigation = useNavigation();

  const clinicLocation = {
    latitude: 19.2073,
    longitude: 72.8479,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  const openGoogleMaps = () => {
    const url = Platform.select({
      ios: `maps://app?daddr=${clinicLocation.latitude},${clinicLocation.longitude}`,
      android: `https://maps.app.goo.gl/hZ22gog9M9LJXu1P6`,
    });
    
    Linking.openURL(url || 'https://maps.app.goo.gl/hZ22gog9M9LJXu1P6');
  };

  const styles = getStyles();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>CLINIC</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleContainer}>
          <Text style={styles.clinicTitle}>Dr. Arvind B Mehta Clinic</Text>
        </View>

        <TouchableOpacity activeOpacity={0.8} onPress={openGoogleMaps}>
          <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              region={clinicLocation}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: clinicLocation.latitude,
                  longitude: clinicLocation.longitude,
                }}
                title="Dr. Arvind B Mehta Clinic"
              />
            </MapView>
            <View style={styles.mapOverlay}>
              <Text style={styles.mapTapText}>Get Directions</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.addressContainer}>
          <Text style={styles.addressTitle}>Clinic Address</Text>
          <Text style={styles.addressLine}>1 & 2 Uttam Bhavan, M.G Road,</Text>
          <Text style={styles.addressLine}>Dahanukar Wadi, Kandivali West,</Text>
          <Text style={styles.addressLine}>Mumbai, Maharashtra 400067</Text>
        </View>

        <View style={styles.contactContainer}>
          <View style={styles.contactRow}>
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>TIMINGS</Text>
              <Text style={styles.contactValue}>Monday - Saturday</Text>
              <Text style={styles.contactTime}>Morning: 9:30 AM - 1:00 PM</Text>
              <Text style={styles.contactTime}>Evening:  5:30 PM - 8:00 PM</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.contactRow}>
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>PHONE</Text>
              <TouchableOpacity onPress={() => Linking.openURL('tel:+919876543210')}>
                <Text style={styles.contactValue}>+91 98765 43210</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const getStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f4f7fa',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#0057b3',
      padding: 16,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    backButton: {
      marginRight: 16,
      padding: 4,
    },
    backIcon: {
      fontSize: 28,
      color: '#fff',
      fontWeight: '600',
    },
    headerText: {
      color: '#fff',
      fontSize: 20,
      fontWeight: '700',
      letterSpacing: 1.2,
    },
    content: {
      flex: 1,
    },
    titleContainer: {
      paddingVertical: 24,
      paddingHorizontal: 20,
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#e8e8e8',
    },
    clinicTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: '#0057b3',
      textAlign: 'center',
      letterSpacing: 0.3,
    },
    mapContainer: {
      height: 280,
      margin: 20,
      borderRadius: 12,
      overflow: 'hidden',
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      backgroundColor: '#fff',
    },
    map: {
      width: '100%',
      height: '100%',
    },
    mapOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 87, 179, 0.95)',
      paddingVertical: 14,
      alignItems: 'center',
    },
    mapTapText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    addressContainer: {
      marginHorizontal: 20,
      marginBottom: 20,
      padding: 24,
      backgroundColor: '#fff',
      borderRadius: 12,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    addressTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#333',
      marginBottom: 16,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    addressLine: {
      fontSize: 15,
      lineHeight: 24,
      color: '#555',
      fontWeight: '400',
    },
    contactContainer: {
      marginHorizontal: 20,
      marginBottom: 20,
      backgroundColor: '#fff',
      borderRadius: 12,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      overflow: 'hidden',
    },
    contactRow: {
      padding: 20,
    },
    contactItem: {
      flex: 1,
    },
    contactLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: '#888',
      marginBottom: 8,
      letterSpacing: 1,
    },
    contactValue: {
      fontSize: 16,
      fontWeight: '600',
      color: '#0057b3',
      marginBottom: 4,
    },
    contactTime: {
      fontSize: 15,
      color: '#555',
      fontWeight: '400',
      lineHeight: 22,
    },
    divider: {
      height: 1,
      backgroundColor: '#e8e8e8',
      marginHorizontal: 20,
    },
  });

export default ClinicLocation;
