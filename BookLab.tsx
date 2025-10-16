import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
const { height } = Dimensions.get('window');

type Lab = {
  id: number;
  lat: number;
  lon: number;
  name: string;
};

const BookLab: React.FC = () => {
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView>(null);

  const [region, setRegion] = useState<Region | null>(null);
  const [labs, setLabs] = useState<Lab[]>([]);

  const fetchNearbyLabs = async (latitude: number, longitude: number) => {
    try {
      const query = `
        [out:json];
        (
          node["amenity"="clinic"](around:2000,${latitude},${longitude});
          node["healthcare"="laboratory"](around:2000,${latitude},${longitude});
          node["healthcare"="diagnostic_centre"](around:2000,${latitude},${longitude});
          node["healthcare"~"diagnostic|lab|pathology"](around:2000,${latitude},${longitude});
          node["name"~"lab|diagnostic|pathology", i](around:2000,${latitude},${longitude});
        );
        out center;
      `;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
      });

      const data = (await response.json()) as any;
      const elements = data?.elements ?? [];
      const labsData: Lab[] = elements
        .map((el: any) => ({
          id: el.id,
          lat: el.lat ?? el.center?.lat,
          lon: el.lon ?? el.center?.lon,
          name: el.tags?.name ?? 'Lab',
        }))
        .filter((lab: Lab) => lab.lat && lab.lon); // remove null coords

      setLabs(labsData);
    } catch (err) {
      console.log('Error fetching labs:', err);
    }
  };

  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Permission denied',
            'Location permission is required to show nearby labs.'
          );
          return;
        }
      }

      const watchId = Geolocation.watchPosition(
        pos => {
          const { latitude, longitude } = pos.coords;
          const newRegion: Region = {
            latitude,
            longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          };
          setRegion(newRegion);

          mapRef.current?.animateToRegion(newRegion, 1000);

          fetchNearbyLabs(latitude, longitude);
        },
        err => Alert.alert('Error', err.message),
        {
          enableHighAccuracy: true,
          distanceFilter: 10,
          interval: 5000,
          fastestInterval: 2000,
        }
      );

      return () => Geolocation.clearWatch(watchId);
    };

    requestLocationPermission();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Google Map */}
        <View style={styles.mapContainer}>
          {region ? (
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              region={region}
              showsUserLocation={true}
              showsMyLocationButton={true}
            >
              {/* User marker */}
              <Marker coordinate={region} title="You are here" pinColor="blue" />

              {/* Lab markers */}
              {labs.map(lab => (
                <Marker
                  key={lab.id}
                  coordinate={{ latitude: lab.lat, longitude: lab.lon }}
                  title={lab.name}
                  pinColor="red"
                />
              ))}
            </MapView>
          ) : (
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapText}>Loading your location...</Text>
            </View>
          )}
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.infoText}>
            The above are the laboratories in your vicinity!
          </Text>

          <View style={styles.orContainer}>
            <View style={styles.line} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.line} />
          </View>

          <Text style={styles.infoText}>
            Book Appointments with DocAssist Labs!
          </Text>

          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => navigation.navigate('LabTests')}
          >
            <Text style={styles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fa' },
  scrollContent: { flexGrow: 1, padding: 15 },
  mapContainer: {
    height: height * 0.65,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
    elevation: 4,
  },
  map: { flex: 1 },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: { color: '#666', fontSize: 16 },
  card: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 4,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    color: '#333',
    textAlign: 'center',
    marginBottom: 3,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  line: { flex: 1, height: 2, backgroundColor: '#999' },
  orText: {
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 8,
    color: '#333',
  },
  bookButton: {
    backgroundColor: '#0057b3',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
    width: '75%',
  },
  bookButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

export default BookLab;
