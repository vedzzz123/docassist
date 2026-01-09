import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, TextInput, Linking, ScrollView } from 'react-native';
import { launchImageLibrary, launchCamera, ImageLibraryOptions, CameraOptions } from 'react-native-image-picker';
import { supabase } from './App';
import { decode } from 'base64-arraybuffer';
import { Session } from '@supabase/supabase-js';

interface PrescriptionPageProps {
  session: Session;
  navigation: any;
}

interface PrescriptionImage {
  id: string;
  name: string;
  uri: string;
  uploaded_by: 'patient' | 'doctor';
  uploaded_at: string;
  notes?: string;
  doctor_name?: string;
}

const PrescriptionPage: React.FC<PrescriptionPageProps> = ({ session, navigation }) => {
  const [images, setImages] = useState<PrescriptionImage[]>([]);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExistingImages();
  }, []);

  const loadExistingImages = async () => {
    try {
      const userId = session?.user?.id;
      if (!userId) return;

      const { data: patientData, error: patientError } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (patientError) {
        console.error('Error loading patient prescriptions:', patientError);
      }

      const { data: doctorData, error: doctorError } = await supabase
        .from('doctor_prescriptions')
        .select('*')
        .eq('patient_user_id', userId)
        .order('uploaded_at', { ascending: false });

      if (doctorError) {
        console.error('Error loading doctor prescriptions:', doctorError);
      }

      const combinedImages: PrescriptionImage[] = [
        ...(patientData || []).map(item => ({
          id: item.id.toString(),
          name: item.file_name,
          uri: item.file_url,
          uploaded_by: 'patient' as const,
          uploaded_at: item.created_at,
        })),
        ...(doctorData || []).map(item => ({
          id: `doctor-${item.id}`,
          name: item.file_name,
          uri: item.file_url,
          uploaded_by: 'doctor' as const,
          uploaded_at: item.uploaded_at,
          notes: item.notes,
          doctor_name: item.doctor_name,
        })),
      ];

      combinedImages.sort((a, b) =>
        new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
      );

      setImages(combinedImages);
    } catch (error) {
      console.error('Error in loadExistingImages:', error);
      Alert.alert('Error', 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const pickImageFromGallery = async () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      includeBase64: true,
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 0.8,
    };

    launchImageLibrary(options, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        Alert.alert('Error', 'Failed to pick image');
      } else if (response.assets && response.assets[0]) {
        await uploadImage(response.assets[0]);
      }
    });
  };

  const takePhotoWithCamera = async () => {
    const options: CameraOptions = {
      mediaType: 'photo',
      includeBase64: true,
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 0.8,
      saveToPhotos: true,
    };

    launchCamera(options, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.errorCode) {
        Alert.alert('Error', 'Failed to take photo');
      } else if (response.assets && response.assets[0]) {
        await uploadImage(response.assets[0]);
      }
    });
  };

  const uploadImage = async (asset: any) => {
    if (!asset.base64) {
      Alert.alert('Error', 'Image data not available');
      return;
    }

    try {
      const userId = session?.user?.id;
      if (!userId) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const fileExt = asset.fileName?.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      const arrayBuffer = decode(asset.base64);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('Patient_Prescriptions')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt}`,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        Alert.alert('Upload Failed', uploadError.message);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('Patient_Prescriptions')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('prescriptions')
        .insert({
          user_id: userId,
          file_name: asset.fileName || fileName,
          file_path: filePath,
          file_url: urlData.publicUrl,
        });

      if (dbError) {
        console.error('Database error:', dbError);
        Alert.alert('Error', 'Failed to save prescription');
        return;
      }

      // ===== 🔥 NEW: TRIGGER OCR PROCESSING =====
      triggerOCRProcessing(urlData.publicUrl, asset.fileName || fileName, userId, 'patient');

      Alert.alert('Success', 'Prescription uploaded successfully!');
      loadExistingImages();
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload prescription');
    }
  };

  // ===== 🔥 NEW FUNCTION: TRIGGER OCR =====
  // ===== 🔥 FIXED: TRIGGER OCR WITH PROPER TYPING =====
// ===== 🔥 FIXED: TRIGGER OCR (No Stack Overflow) =====
const triggerOCRProcessing = async (
  fileUrl: string, 
  fileName: string, 
  userId: string, 
  uploadedBy: 'patient' | 'doctor'
) => {
  // Prevent multiple simultaneous calls
  if ((global as any).ocrProcessing) {
    return;
  }
  
  try {
    (global as any).ocrProcessing = true;
    console.log('🔍 Starting OCR for:', fileName);
    
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (!currentSession?.access_token) {
      console.log('⚠️ No auth token, skipping OCR');
      return;
    }

    const response = await fetch(
      'https://uzybksfptohhqyrtoanq.supabase.co/functions/v1/process-document',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSession.access_token}`,
        },
        body: JSON.stringify({
          fileUrl: fileUrl,
          fileName: fileName,
          userId: userId,
          uploadedBy: uploadedBy
        })
      }
    );

    if (response.ok) {
      const result: any = await response.json();
      if (result.success) {
        console.log('✅ OCR Success:', result.extraction?.document_type || 'processed');
      } else {
        console.log('⚠️ OCR processing issue');
      }
    } else {
      console.log('⚠️ OCR request failed');
    }
  } catch (error) {
    // Don't log the error object to avoid recursion
    console.log('⚠️ OCR failed - continuing without it');
  } finally {
    (global as any).ocrProcessing = false;
  }
};



  const deleteImage = async (image: PrescriptionImage, index: number) => {
    if (image.uploaded_by === 'doctor') {
      Alert.alert('Cannot Delete', 'You cannot delete prescriptions uploaded by your doctor.');
      return;
    }

    Alert.alert(
      'Delete Prescription',
      'Are you sure you want to delete this prescription?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const userId = session?.user?.id;
              if (!userId) return;

              const { error: dbError } = await supabase
                .from('prescriptions')
                .delete()
                .eq('id', parseInt(image.id));

              if (dbError) {
                console.error('Delete error:', dbError);
                Alert.alert('Error', 'Failed to delete prescription');
                return;
              }

              Alert.alert('Success', 'Prescription deleted successfully');
              loadExistingImages();
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete prescription');
            }
          },
        },
      ]
    );
  };

  const openRenameModal = (index: number) => {
    if (images[index].uploaded_by === 'doctor') {
      Alert.alert('Cannot Rename', 'You cannot rename prescriptions uploaded by your doctor.');
      return;
    }

    setSelectedImageIndex(index);
    setNewName(images[index].name);
    setRenameModalVisible(true);
  };

  const renameImage = async () => {
    if (selectedImageIndex === null) return;

    try {
      const image = images[selectedImageIndex];
      const { error } = await supabase
        .from('prescriptions')
        .update({ file_name: newName })
        .eq('id', parseInt(image.id));

      if (error) {
        console.error('Rename error:', error);
        Alert.alert('Error', 'Failed to rename prescription');
        return;
      }

      Alert.alert('Success', 'Prescription renamed successfully');
      setRenameModalVisible(false);
      loadExistingImages();
    } catch (error) {
      console.error('Rename error:', error);
      Alert.alert('Error', 'Failed to rename prescription');
    }
  };

  const openImage = (uri: string) => {
    Linking.openURL(uri).catch(err => {
      console.error('Failed to open image:', err);
      Alert.alert('Error', 'Failed to open image');
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>My Prescriptions</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={pickImageFromGallery}>
            <Text style={styles.buttonText}>UPLOAD</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={takePhotoWithCamera}>
            <Text style={styles.buttonText}>TAKE PHOTO</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Loading prescriptions...</Text>
        ) : images.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No prescriptions uploaded yet</Text>
          </View>
        ) : (
          <View style={styles.imageList}>
            {images.map((image, index) => (
              <TouchableOpacity
                key={image.id}
                style={[
                  styles.imageCard,
                  image.uploaded_by === 'doctor' && styles.doctorCard
                ]}
                onPress={() => openImage(image.uri)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleContainer}>
                    <Text style={styles.imageName}>{image.name}</Text>
                    <Text style={styles.dateText}>
                      {new Date(image.uploaded_at).toLocaleDateString()}
                    </Text>
                  </View>
                  
                  <View style={[
                    styles.badge,
                    image.uploaded_by === 'doctor' ? styles.doctorBadge : styles.patientBadge
                  ]}>
                    <Text style={styles.badgeText}>
                      {image.uploaded_by === 'doctor' ? 'Doctor' : 'Patient'}
                    </Text>
                  </View>
                </View>

                {image.notes && (
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesLabel}>Notes:</Text>
                    <Text style={styles.notesText}>{image.notes}</Text>
                  </View>
                )}

                {image.doctor_name && (
                  <Text style={styles.doctorNameText}>
                    Uploaded by: {image.doctor_name}
                  </Text>
                )}

                <View style={styles.imageActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openImage(image.uri)}
                  >
                    <Text style={styles.actionText}>View</Text>
                  </TouchableOpacity>

                  {image.uploaded_by === 'patient' && (
                    <>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => openRenameModal(index)}
                      >
                        <Text style={styles.actionText}>Rename</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => deleteImage(image, index)}
                      >
                        <Text style={styles.deleteText}>Delete</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={renameModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rename Prescription</Text>
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter new name"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setRenameModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={renameImage}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 20,
    color: '#1a1a1a',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    backgroundColor: '#0057b3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#666',
    marginTop: 40,
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
  imageList: {
    gap: 16,
  },
  imageCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
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
  imageName: {
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
  imageActions: {
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
  deleteButton: {
    backgroundColor: '#fee',
  },
  actionText: {
    color: '#0057b3',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  modalButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: '#27ae60',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default PrescriptionPage;
