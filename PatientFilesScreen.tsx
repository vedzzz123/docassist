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
  Image,
  Dimensions,
} from 'react-native';
import { supabase } from './App';
import { useNavigation, useRoute } from '@react-navigation/native';

// ✅ ADD THESE TYPE DEFINITIONS
interface PrescriptionFile {
  id: number;
  file_name: string;
  file_url: string;
  created_at: string;
}

// ✅ Fix route params typing
interface RouteParams {
  userId: string;
  patientName: string;
}

const { width } = Dimensions.get('window');
const numColumns = 2;
const imageSize = (width - 48) / numColumns;

const PatientFilesScreen = () => {
  const [files, setFiles] = useState<PrescriptionFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>(); // ✅ Add <any>
  const route = useRoute<any>(); // ✅ Add <any>
  
  // ✅ Fix the destructuring
  const { userId, patientName } = route.params as RouteParams;

  useEffect(() => {
    fetchPatientFiles();
  }, []);

  const fetchPatientFiles = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('prescriptions')
        .select('id, file_name, file_url, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching files:', error);
        Alert.alert('Error', 'Failed to load files');
        return;
      }

      setFiles(data || []);

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
    fetchPatientFiles();
  };

  const openImageViewer = (file: PrescriptionFile, index: number) => {
    navigation.navigate('ImageViewerScreen', {
      files: files,
      initialIndex: index,
      patientName: patientName,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderFileCard = ({ item, index }: { item: PrescriptionFile; index: number }) => (
    <TouchableOpacity
      style={styles.fileCard}
      onPress={() => openImageViewer(item, index)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.file_url }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={1}>
          {item.file_name}
        </Text>
        <Text style={styles.fileDate}>{formatDate(item.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );

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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{patientName}</Text>
          <Text style={styles.headerSubtitle}>
            {files.length} {files.length === 1 ? 'file' : 'files'}
          </Text>
        </View>
      </View>

      <FlatList
        data={files}
        renderItem={renderFileCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={numColumns}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyText}>No files uploaded</Text>
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
  headerContent: {
    flex: 1,
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
  listContainer: {
    padding: 16,
  },
  fileCard: {
    width: imageSize,
    marginBottom: 16,
    marginHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: imageSize,
    backgroundColor: '#f0f0f0',
  },
  fileInfo: {
    padding: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  fileDate: {
    fontSize: 12,
    color: '#666',
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

export default PatientFilesScreen;
