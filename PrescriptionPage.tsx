import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, TextInput, Linking } from 'react-native';
import { launchImageLibrary, launchCamera, ImageLibraryOptions, CameraOptions, MediaType } from 'react-native-image-picker';
import { supabase } from './App';
import { decode } from 'base64-arraybuffer';
import { Session } from '@supabase/supabase-js';

interface PrescriptionPageProps {
  session: Session;
  navigation: any;
}

const PrescriptionPage: React.FC<PrescriptionPageProps> = ({ session, navigation }) => {
  const [images, setImages] = useState<any[]>([]);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExistingImages();
  }, []);

  // Load files from database table (persistent storage)
  const loadExistingImages = async () => {
    try {
      if (!session?.user) {
        console.log('❌ No session or user found');
        setLoading(false);
        return;
      }

      console.log('📂 Loading existing images for user:', session.user.email);
      console.log('🆔 User ID:', session.user.id);

      // Query database table instead of storage directly
      const { data: files, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database query error:', error);
        // Fallback to storage listing if database fails
        await loadFromStorage();
        return;
      }

      if (files && files.length > 0) {
        console.log(`📸 Found ${files.length} existing images in database`);
        setImages(files);
        console.log('✅ Loaded existing images from database successfully');
      } else {
        console.log('📭 No existing images found in database');
      }
    } catch (error) {
      console.error('❌ Error in loadExistingImages:', error);
      // Fallback to storage listing
      await loadFromStorage();
    } finally {
      setLoading(false);
    }
  };

  // Fallback method to load from storage directly
  const loadFromStorage = async () => {
    try {
      const { data: files, error } = await supabase.storage
        .from('Patient_Prescriptions')
        .list(session.user.id, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('Storage list error:', error);
        return;
      }

      if (files && files.length > 0) {
        console.log(`📸 Found ${files.length} existing images in storage`);
        
        const existingImages = files.map((file) => {
          const filePath = `${session.user.id}/${file.name}`;
          const { data: urlData } = supabase.storage
            .from('Patient_Prescriptions')
            .getPublicUrl(filePath);

          return {
            file_name: file.name,
            file_path: filePath,
            file_url: urlData.publicUrl,
            user_id: session.user.id,
            created_at: new Date().toISOString()
          };
        });

        setImages(existingImages);
        console.log('✅ Loaded existing images from storage successfully');
      }
    } catch (error) {
      console.error('❌ Error in loadFromStorage:', error);
    }
  };

  // Save file metadata to database
  const saveFileToDatabase = async (fileName: string, filePath: string, fileUrl: string) => {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .insert({
          user_id: session.user.id,
          file_name: fileName,
          file_path: filePath,
          file_url: fileUrl
        })
        .select()
        .single();

      if (error) {
        console.error('Database save error:', error);
        return null;
      }
      console.log('✅ File info saved to database');
      return data;
    } catch (error) {
      console.error('❌ Database save catch error:', error);
      return null;
    }
  };

  const uploadImageToSupabase = async (image: { uri: string; name: string; base64: string }) => {
    try {
      if (!session?.user) {
        Alert.alert('Authentication Required', 'Please log in again');
        return null;
      }

      const user = session.user;
      console.log('✅ User found:', user.email);

      // Create filename with timestamp (but folder stays consistent)
      const fileExt = image.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // ✅ CONSISTENT FOLDER NAMING: Always use user.id as folder name
      const filePath = `${user.id}/${fileName}`;
      console.log('📁 Uploading to consistent folder path:', filePath);

      const arrayBuffer = decode(image.base64);

      // Upload to storage
      const { data, error } = await supabase.storage
        .from('Patient_Prescriptions')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt}`,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        Alert.alert('Upload Error', error.message);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('Patient_Prescriptions')
        .getPublicUrl(filePath);

      // Save to database for persistence
      const dbRecord = await saveFileToDatabase(image.name, filePath, urlData.publicUrl);
      
      console.log('✅ File uploaded successfully to folder:', user.id);
      Alert.alert('Success', 'Image uploaded successfully!');
      
      return dbRecord || {
        file_name: image.name,
        file_path: filePath,
        file_url: urlData.publicUrl,
        user_id: user.id,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Upload error:', error);
      Alert.alert('Error', `Upload failed: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  };

  const deleteImageFromSupabase = async (filePath: string, dbId?: number) => {
    try {
      if (!session?.user) {
        Alert.alert('Authentication Required', 'Please log in again');
        return false;
      }

      console.log('🗑️ Deleting file from path:', filePath);

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('Patient_Prescriptions')
        .remove([filePath]);

      // Delete from database if ID exists
      if (dbId) {
        const { error: dbError } = await supabase
          .from('prescriptions')
          .delete()
          .eq('id', dbId);

        if (dbError) {
          console.error('Database delete error:', dbError);
        }
      }

      if (storageError) {
        console.error('Storage delete error:', storageError);
        Alert.alert('Delete Error', storageError.message);
        return false;
      }

      console.log('✅ File deleted from storage and database');
      return true;
    } catch (error) {
      console.error('❌ Delete error:', error);
      Alert.alert('Error', `Delete failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  };

  const handleUpload = () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo' as MediaType,
      includeBase64: true,
    };

    launchImageLibrary(options, async (response) => {
      if (response.assets && response.assets[0]) {
        const { uri, fileName, base64 } = response.assets[0];
        if (uri && fileName && base64) {
          Alert.alert('Uploading...', 'Please wait while we upload your image');
          
          const uploadResult = await uploadImageToSupabase({
            uri,
            name: fileName,
            base64,
          });
          
          if (uploadResult) {
            setImages((prevImages) => [uploadResult, ...prevImages]);
            Alert.alert('Success', `File uploaded: ${fileName}`);
          }
        } else {
          Alert.alert('Error', 'Invalid image or file name');
        }
      } else {
        Alert.alert('Error', 'No file selected');
      }
    });
  };

  const handleTakePicture = () => {
    const options: CameraOptions = {
      mediaType: 'photo' as MediaType,
      includeBase64: true,
      saveToPhotos: true,
    };

    launchCamera(options, async (response) => {
      if (response.didCancel) {
        return;
      } else if (response.errorCode) {
        Alert.alert('Camera Error', response.errorMessage || 'Unknown error');
      } else if (response.assets && response.assets[0]) {
        const { uri, fileName, base64 } = response.assets[0];
        const validName = fileName || `camera_pic_${Date.now()}.jpg`;

        if (uri && base64) {
          Alert.alert('Uploading...', 'Please wait while we upload your image');
          
          const uploadResult = await uploadImageToSupabase({
            uri,
            name: validName,
            base64,
          });
          
          if (uploadResult) {
            setImages((prevImages) => [uploadResult, ...prevImages]);
            Alert.alert('Success', `Picture uploaded: ${validName}`);
          }
        } else {
          Alert.alert('Error', 'Invalid image data captured');
        }
      } else {
        Alert.alert('Error', 'No picture taken');
      }
    });
  };

  const handleDelete = (index: number) => {
    Alert.alert(
      'Delete File',
      'Are you sure you want to delete the selected file?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            const imageToDelete = images[index];
            const deleted = await deleteImageFromSupabase(
              imageToDelete.file_path, 
              imageToDelete.id
            );
            
            if (deleted) {
              const updatedImages = images.filter((_, i) => i !== index);
              setImages(updatedImages);
              Alert.alert('Success', 'File has been deleted from storage and database');
            }
          },
        },
      ]
    );
  };

  const handleRename = (index: number) => {
    setNewName(images[index].file_name.replace(/\.[^/.]+$/, ''));
    setSelectedImageIndex(index);
    setRenameModalVisible(true);
  };

  const handleSaveRename = async () => {
    if (selectedImageIndex !== null && newName.trim() !== '') {
      const file = images[selectedImageIndex];
      const extension = file.file_name.split('.').pop();
      const newFileName = `${newName.trim()}.${extension}`;

      // Update in database if ID exists
      if (file.id) {
        const { error } = await supabase
          .from('prescriptions')
          .update({ file_name: newFileName })
          .eq('id', file.id);

        if (error) {
          Alert.alert('Error', 'Failed to rename file');
          return;
        }
      }

      const updatedImages = [...images];
      updatedImages[selectedImageIndex].file_name = newFileName;
      setImages(updatedImages);
      setRenameModalVisible(false);
      setNewName('');
      setSelectedImageIndex(null);
      Alert.alert('Success', 'File renamed successfully');
    } else {
      Alert.alert('Error', 'Please provide a valid name');
    }
  };

  const openRemoteImage = async (imageUrl: string) => {
    if (imageUrl) {
      try {
        console.log('🔗 Opening URL:', imageUrl);
        
        const canOpen = await Linking.canOpenURL(imageUrl);
        if (canOpen) {
          await Linking.openURL(imageUrl);
        } else {
          Alert.alert('Error', 'Cannot open this image URL');
        }
      } catch (error) {
        console.error('Error opening URL:', error);
        Alert.alert('Error', 'Could not open image link');
      }
    }
  };

  const displayName = (name: string) => name.replace(/\.[^/.]+$/, '');

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <Text style={styles.title}>Loading your prescriptions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Your Prescriptions</Text>
      
      <View style={styles.uploadButtons}>
        <TouchableOpacity style={styles.cameraButton} onPress={handleTakePicture}>
          <Text style={styles.cameraIcon}>📸</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.floatingButton} onPress={handleUpload}>
          <Text style={styles.plusText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.imageList}>
        {images.length > 0 ? (
          images.map((image, index) => (
            <View key={image.id || index} style={styles.imageItem}>
              <Text style={styles.imageName}>{displayName(image.file_name)}</Text>
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => openRemoteImage(image.file_url)}
                >
                  <Text style={styles.actionText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.renameButton} onPress={() => handleRename(index)}>
                  <Text style={styles.actionText}>Rename</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(index)}>
                  <Text style={styles.actionText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noImageContainer}>
            <Text style={styles.noImageText}>No prescriptions uploaded yet</Text>
          </View>
        )}
      </View>

      {renameModalVisible && (
        <Modal visible={renameModalVisible} transparent animationType="fade">
          <View style={styles.modalBackground}>
            <View style={styles.renameModalContainer}>
              <Text style={styles.modalTitle}>Rename File</Text>
              <TextInput
                style={styles.input}
                value={newName}
                onChangeText={setNewName}
                placeholder="Enter new name"
              />
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveRename}>
                <Text style={styles.actionText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setRenameModalVisible(false)}
              >
                <Text style={styles.actionText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7fa',
    paddingHorizontal: 20,
  },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  uploadButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  cameraButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  cameraIcon: { fontSize: 30, color: '#0057b3' },
  floatingButton: {
    backgroundColor: '#0057b3',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  plusText: { fontSize: 36, color: '#fff', fontWeight: 'bold' },
  imageList: { width: '100%', paddingBottom: 20 },
  imageItem: {
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  imageName: { fontSize: 16, color: '#333', marginBottom: 10 },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  viewButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  renameButton: {
    backgroundColor: '#ff9800',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  deleteButton: {
    backgroundColor: '#ff4d4d',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  actionText: { color: '#fff', fontWeight: 'bold' },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  renameModalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: '#ff4d4d',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  noImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },
  noImageText: { fontSize: 16, color: '#777', textAlign: 'center', fontStyle: 'italic' },
});

export default PrescriptionPage;
