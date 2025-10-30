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
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  const { userId, patientName } = route.params;

  const pickFromCamera = () => {
    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: true,
        includeBase64: true, // ✅ KEY: Get base64
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
        includeBase64: true, // ✅ KEY: Get base64
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

      // Create filename
      const fileExt = selectedImage.fileName?.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      console.log('📁 Uploading to path:', filePath);

      // ✅ USE YOUR WORKING METHOD: base64-arraybuffer
      const arrayBuffer = decode(selectedImage.base64);

      // Upload to Doctor_Prescriptions bucket
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

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('Doctor_Prescriptions')
        .getPublicUrl(filePath);

      console.log('🔗 Public URL:', urlData.publicUrl);

      // Save metadata to database
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Upload Prescription</Text>
          <Text style={styles.headerSubtitle}>For {patientName}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Image Preview */}
        {selectedImage ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setSelectedImage(null)}
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

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.smallButton}
            onPress={pickFromCamera}
            disabled={uploading}
          >
            <Text style={styles.smallButtonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.smallButton}
            onPress={pickFromGallery}
            disabled={uploading}
          >
            <Text style={styles.smallButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Notes Input */}
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add notes about this prescription..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!uploading}
          />
        </View>

        {/* Upload Button */}
        <TouchableOpacity
          style={[
            styles.uploadButton,
            (!selectedImage || uploading) && styles.uploadButtonDisabled,
          ]}
          onPress={uploadPrescription}
          disabled={!selectedImage || uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.uploadButtonText}>Upload Prescription</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
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
