import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  ScrollView,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { supabase } from './App';
import { decode } from 'base64-arraybuffer';
import { useNavigation, useRoute } from '@react-navigation/native';

const DoctorUploadPrescriptionScreen = () => {
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, patientName } = route.params as any;

  const pickFromCamera = () => {
    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: true,
        includeBase64: true,
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled camera');
        } else if (response.errorCode) {
          Alert.alert('Error', 'Camera error: ' + response.errorMessage);
        } else if (response.assets && response.assets[0]) {
          setSelectedImage(response.assets[0]);
        }
      }
    );
  };

  const pickFromGallery = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: true,
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled gallery');
        } else if (response.errorCode) {
          Alert.alert('Error', 'Gallery error: ' + response.errorMessage);
        } else if (response.assets && response.assets[0]) {
          setSelectedImage(response.assets[0]);
        }
      }
    );
  };

  const uploadPrescription = async () => {
    if (!selectedImage || !selectedImage.base64) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    try {
      setUploading(true);
      console.log('✅ Starting upload for patient:', patientName);

      const fileExt = selectedImage.fileName?.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      console.log('📁 Uploading to path:', filePath);

      const arrayBuffer = decode(selectedImage.base64);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('Doctor_Prescriptions')
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

      console.log('✅ Upload successful!');

      const { data: urlData } = supabase.storage
        .from('Doctor_Prescriptions')
        .getPublicUrl(filePath);

      console.log('🔗 Public URL:', urlData.publicUrl);

      const { error: dbError } = await supabase
        .from('doctor_prescriptions')
        .insert({
          patient_user_id: userId,
          doctor_name: 'Dr. Mehta',
          file_name: selectedImage.fileName || fileName,
          file_path: filePath,
          file_url: urlData.publicUrl,
          notes: notes.trim() || null,
        });

      if (dbError) {
        console.error('Database error:', dbError);
        Alert.alert('Error', 'Failed to save prescription details');
        return;
      }

      // ===== 🔥 NEW: TRIGGER OCR PROCESSING =====
      triggerOCRProcessing(urlData.publicUrl, selectedImage.fileName || fileName, userId, 'doctor');

      Alert.alert(
        'Success',
        'Prescription uploaded successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('❌ Upload error:', error);
      Alert.alert('Error', `Something went wrong: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setUploading(false);
    }
  };

  // ===== 🔥 NEW FUNCTION: TRIGGER OCR =====
  // ===== 🔥 FIXED: TRIGGER OCR (No Stack Overflow) =====
const triggerOCRProcessing = async (
  fileUrl: string, 
  fileName: string, 
  userId: string, 
  uploadedBy: 'doctor'
) => {
  // Prevent multiple simultaneous calls
  if ((global as any).ocrProcessing) {
    return;
  }
  
  try {
    (global as any).ocrProcessing = true;
    console.log('🔍 Starting OCR for:', fileName);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      console.log('⚠️ No auth token, skipping OCR');
      return;
    }

    const response = await fetch(
      'https://uzybksfptohhqyrtoanq.supabase.co/functions/v1/process-document',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Upload Prescription</Text>
          <Text style={styles.headerSubtitle}>For {patientName}</Text>
        </View>
      </View>

      <View style={styles.content}>
        {selectedImage ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />
            <TouchableOpacity
              onPress={() => setSelectedImage(null)}
              style={styles.removeImageButton}
            >
              <Text style={styles.removeImageText}>✕ Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>📄</Text>
            <Text style={styles.placeholderText}>No image selected</Text>
          </View>
        )}

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.smallButton} onPress={pickFromCamera}>
            <Text style={styles.smallButtonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallButton} onPress={pickFromGallery}>
            <Text style={styles.smallButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add prescription notes or instructions..."
            multiline
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.uploadButton, (!selectedImage || uploading) && styles.uploadButtonDisabled]}
          onPress={uploadPrescription}
          disabled={!selectedImage || uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.uploadButtonText}>Upload Prescription</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fa',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0e0e0',
    marginTop: 2,
  },
  content: {
    padding: 20,
  },
  imagePreviewContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  imagePreview: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  removeImageButton: {
    marginTop: 12,
    padding: 8,
  },
  removeImageText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  smallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0057b3',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  smallButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  notesContainer: {
    marginBottom: 20,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 100,
  },
  uploadButton: {
    backgroundColor: '#27ae60',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default DoctorUploadPrescriptionScreen;
