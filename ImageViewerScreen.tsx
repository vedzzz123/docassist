import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

interface PrescriptionFile {
  id: number;
  file_name: string;
  file_url: string;
  created_at: string;
}

const { width, height } = Dimensions.get('window');

const ImageViewerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  const { files, initialIndex, patientName } = route.params as {
    files: PrescriptionFile[];
    initialIndex: number;
    patientName: string;
  };

  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderImage = ({ item }: { item: PrescriptionFile }) => (
    <View style={styles.imageContainer}>
      <Image
        source={{ uri: item.file_url }}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{patientName}</Text>
          <Text style={styles.headerSubtitle}>
            {currentIndex + 1} of {files.length}
          </Text>
        </View>
      </View>

      {/* Image Viewer */}
      <FlatList
        data={files}
        renderItem={renderImage}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        pagingEnabled
        initialScrollIndex={initialIndex}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        getItemLayout={(data, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      {/* Footer with file info */}
      <View style={styles.footer}>
        <Text style={styles.fileName}>{files[currentIndex].file_name}</Text>
        <Text style={styles.fileDate}>
          Uploaded: {formatDate(files[currentIndex].created_at)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 10,
  },
  closeButton: {
    marginRight: 15,
  },
  closeIcon: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0e0e0',
    marginTop: 2,
  },
  imageContainer: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width,
    height: height * 0.8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  fileDate: {
    fontSize: 14,
    color: '#e0e0e0',
  },
});

export default ImageViewerScreen;
