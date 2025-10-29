import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { supabase } from './App';
import { useNavigation } from '@react-navigation/native';

interface PatientWithFiles {
  user_id: string;
  patient_name: string;
  file_count: number;
}

const PatientsListScreen = () => {
  const [patients, setPatients] = useState<PatientWithFiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  useEffect(() => {
    fetchPatientsWithPrescriptions();
  }, []);

  const fetchPatientsWithPrescriptions = async () => {
    try {
      setLoading(true);

      // Step 1: Fetch all prescriptions (no JOIN)
      const { data: prescriptions, error } = await supabase
        .from('prescriptions')
        .select('user_id, file_name');

      if (error) {
        console.error('Error fetching prescriptions:', error);
        Alert.alert('Error', 'Failed to load prescriptions: ' + error.message);
        return;
      }

      if (!prescriptions || prescriptions.length === 0) {
        setPatients([]);
        return;
      }

      // Step 2: Get unique user IDs
      const userIds = [...new Set(prescriptions.map((p: any) => p.user_id))];
      console.log('User IDs found:', userIds);

      // Step 3: Fetch user details separately
      const { data: users, error: userError } = await supabase
        .from('user_details')
        .select('user_id, name, surname')
        .in('user_id', userIds);

      if (userError) {
        console.error('Error fetching users:', userError);
      }

      console.log('Users fetched:', users);

      // Step 4: Manually merge data and count files per user
      const patientMap = new Map<string, PatientWithFiles>();

      prescriptions.forEach((prescription: any) => {
        const userId = prescription.user_id;
        
        if (patientMap.has(userId)) {
          const existing = patientMap.get(userId)!;
          existing.file_count++;
        } else {
          const user = users?.find((u: any) => u.user_id === userId);
          const userName = user ? `${user.name} ${user.surname}` : 'Unknown Patient';
          
          patientMap.set(userId, {
            user_id: userId,
            patient_name: userName,
            file_count: 1,
          });
        }
      });

      const patientsList = Array.from(patientMap.values());
      console.log('Final patients list:', patientsList);
      setPatients(patientsList);

    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPatientsWithPrescriptions();
  };

  const openPatientFiles = (patient: PatientWithFiles) => {
    navigation.navigate('PatientFilesScreen', {
      userId: patient.user_id,
      patientName: patient.patient_name,
    });
  };

  const renderPatientCard = ({ item }: { item: PatientWithFiles }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => openPatientFiles(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>👤</Text>
        </View>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{item.patient_name}</Text>
          <Text style={styles.fileCount}>
            📄 {item.file_count} {item.file_count === 1 ? 'file' : 'files'} uploaded
          </Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0057b3" />
        <Text style={styles.loadingText}>Loading patients...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Patient Prescriptions</Text>
        <Text style={styles.headerSubtitle}>
          {patients.length} {patients.length === 1 ? 'patient' : 'patients'} with files
        </Text>
      </View>

      <FlatList
        data={patients}
        renderItem={renderPatientCard}
        keyExtractor={(item) => item.user_id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyText}>No prescriptions uploaded yet</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#0057b3',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0e0e0',
    marginTop: 5,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  iconText: {
    fontSize: 24,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  fileCount: {
    fontSize: 14,
    color: '#666',
  },
  arrow: {
    fontSize: 32,
    color: '#0057b3',
    fontWeight: '300',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default PatientsListScreen;
