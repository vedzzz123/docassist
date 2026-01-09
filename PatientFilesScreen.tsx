import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import { supabase } from './App';
import { useNavigation, useRoute } from '@react-navigation/native';

interface PrescriptionFile {
  id: string;
  file_name: string;
  file_url: string;
  created_at: string;
  uploaded_by: 'patient' | 'doctor';
  notes?: string;
  doctor_name?: string;
}

interface RouteParams {
  userId: string;
  patientName: string;
}

const PatientFilesScreen = () => {
  const [files, setFiles] = useState<PrescriptionFile[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  const { userId, patientName } = route.params as RouteParams;

  useEffect(() => {
    fetchAllFiles();
  }, []);

  const fetchAllFiles = async () => {
    try {
      setLoading(true);

      // Fetch patient uploads
      const { data: patientFiles, error: patientError } = await supabase
        .from('prescriptions')
        .select('id, file_name, file_url, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (patientError) {
        console.error('Error fetching patient files:', patientError);
      }

      // Fetch doctor uploads
      const { data: doctorFiles, error: doctorError } = await supabase
        .from('doctor_prescriptions')
        .select('id, file_name, file_url, uploaded_at, notes, doctor_name')
        .eq('patient_user_id', userId)
        .order('uploaded_at', { ascending: false });

      if (doctorError) {
        console.error('Error fetching doctor files:', doctorError);
      }

      // Combine both arrays
      const combinedFiles: PrescriptionFile[] = [
        ...(patientFiles || []).map(file => ({
          id: file.id.toString(),
          file_name: file.file_name,
          file_url: file.file_url,
          created_at: file.created_at,
          uploaded_by: 'patient' as const,
        })),
        ...(doctorFiles || []).map(file => ({
          id: `doctor-${file.id}`,
          file_name: file.file_name,
          file_url: file.file_url,
          created_at: file.uploaded_at,
          uploaded_by: 'doctor' as const,
          notes: file.notes,
          doctor_name: file.doctor_name,
        })),
      ];

      // Sort by date
      combinedFiles.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setFiles(combinedFiles);
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const openImage = (uri: string) => {
    Linking.openURL(uri).catch(err => {
      console.error('Failed to open image:', err);
      Alert.alert('Error', 'Failed to open image');
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0057b3" />
        <Text style={styles.loadingText}>Loading files...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{patientName}</Text>
          <Text style={styles.headerSubtitle}>
            {files.length} {files.length === 1 ? 'file' : 'files'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {files.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No prescriptions uploaded yet</Text>
          </View>
        ) : (
          files.map((file) => (
            <View 
              key={file.id} 
              style={[
                styles.fileCard,
                file.uploaded_by === 'doctor' && styles.doctorCard
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <Text style={styles.fileName} numberOfLines={1}>{file.file_name}</Text>
                  <Text style={styles.dateText}>{formatDate(file.created_at)}</Text>
                </View>
                <View style={[
                  styles.badge,
                  file.uploaded_by === 'doctor' ? styles.doctorBadge : styles.patientBadge
                ]}>
                  <Text style={styles.badgeText}>
                    {file.uploaded_by === 'doctor' ? 'Doctor' : 'Patient'}
                  </Text>
                </View>
              </View>

              {file.notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>Notes:</Text>
                  <Text style={styles.notesText}>{file.notes}</Text>
                </View>
              )}

              {file.doctor_name && (
                <Text style={styles.doctorNameText}>Uploaded by: {file.doctor_name}</Text>
              )}

              <View style={styles.fileActions}>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => openImage(file.file_url)}
                >
                  <Text style={styles.actionText}>View</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => navigation.navigate('DoctorUploadPrescription', {
          userId: userId,
          patientName: patientName,
        })}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 15,
    color: '#666',
  },
  header: {
    backgroundColor: '#0057b3',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  backIcon: {
    fontSize: 36,
    color: '#fff',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0e0e0',
    marginTop: 2,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#999',
  },
  fileCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  doctorCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    color: '#666',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  doctorBadge: {
    backgroundColor: '#27ae60',
  },
  patientBadge: {
    backgroundColor: '#3498db',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  notesContainer: {
    marginTop: 8,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  doctorNameText: {
    fontSize: 13,
    color: '#27ae60',
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 12,
  },
  fileActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  actionText: {
    color: '#0057b3',
    fontSize: 14,
    fontWeight: '500',
  },
  fabButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#316ad2ff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabIcon: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
});

export default PatientFilesScreen;
