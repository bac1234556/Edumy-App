import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getCloudinarySignature, uploadToCloudinary } from '../api/cloudinaryUpload';
import { UploadProgressBar } from '../components/UploadProgressBar';

export const LessonMediaUploadScreen = ({ navigation }) => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedResult, setUploadedResult] = useState(null);

  // Chọn video từ thiết bị Android
  const handlePickVideo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện để chọn video.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setSelectedVideo({
        uri: asset.uri,
        duration: asset.duration ? Math.round(asset.duration / 1000) : 0,
      });
      setUploadedResult(null);
    }
  };

  // Tiến hành ký và tải lên Cloudinary
  const handleStartUpload = async () => {
    if (!selectedVideo) {
      Alert.alert('Chưa chọn tệp', 'Vui lòng chọn video mẫu từ thiết bị trước khi tải lên.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Bước 1: Lấy chữ ký từ BE
      const signatureData = await getCloudinarySignature('edumy/lessons/videos');

      // Bước 2: Tải lên Cloudinary
      const result = await uploadToCloudinary(
        selectedVideo.uri,
        'video',
        signatureData,
        (percent) => setUploadProgress(percent)
      );

      setUploadedResult(result);
      Alert.alert('Thành công', 'Đã tải video bài học lên Cloudinary thành công!');
    } catch (error) {
      Alert.alert('Lỗi tải lên', error.message || 'Không thể tải video, vui lòng kiểm tra kết nối mạng.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Tải lên Video Bài Học (Cloudinary Direct)</Text>
        <Text style={styles.subtitle}>Video được gửi trực tiếp từ Android lên Cloudinary thông qua chữ ký bảo mật</Text>

        <TouchableOpacity style={styles.pickerBox} onPress={handlePickVideo} disabled={isUploading}>
          <Text style={styles.pickerIcon}>📹</Text>
          <Text style={styles.pickerText}>
            {selectedVideo ? 'Đã chọn: ' + selectedVideo.uri.split('/').pop() : 'Nhấn để chọn video từ thiết bị Android'}
          </Text>
        </TouchableOpacity>

        {selectedVideo && !isUploading && (
          <TouchableOpacity style={styles.uploadBtn} onPress={handleStartUpload}>
            <Text style={styles.uploadBtnText}>Bắt đầu tải lên Cloudinary</Text>
          </TouchableOpacity>
        )}

        <UploadProgressBar
          visible={isUploading}
          progress={uploadProgress}
          statusText="Đang tải video lên Cloudinary..."
        />

        {uploadedResult && (
          <View style={styles.resultCard}>
            <Text style={styles.resultHeader}>Kết quả Upload Thành Công:</Text>
            <Text style={styles.resultLabel}>Video URL: <Text style={styles.resultValue}>{uploadedResult.url}</Text></Text>
            <Text style={styles.resultLabel}>Public ID: <Text style={styles.resultValue}>{uploadedResult.publicId}</Text></Text>
            <Text style={styles.resultLabel}>Duration: <Text style={styles.resultValue}>{uploadedResult.duration} giây</Text></Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 20 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  pickerBox: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 28,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    marginBottom: 16,
  },
  pickerIcon: { fontSize: 40, marginBottom: 8 },
  pickerText: { fontSize: 14, color: '#4B5563', textAlign: 'center' },
  uploadBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  resultCard: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 8,
  },
  resultHeader: { fontSize: 15, fontWeight: '700', color: '#065F46', marginBottom: 8 },
  resultLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginVertical: 2 },
  resultValue: { fontWeight: '400', color: '#059669' },
});