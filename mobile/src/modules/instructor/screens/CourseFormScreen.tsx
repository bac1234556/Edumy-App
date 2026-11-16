import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CourseItem } from '../mock/courses.mock';

interface Props {
  route: any;
  navigation: any;
}

export const CourseFormScreen: React.FC<Props> = ({ route, navigation }) => {
  const existingCourse: CourseItem | null = route.params?.course || null;
  const isEdit = !!existingCourse;

  const [title, setTitle] = useState(existingCourse?.title || '');
  const [description, setDescription] = useState(existingCourse?.description || '');
  const [price, setPrice] = useState(existingCourse?.price !== undefined ? String(existingCourse.price) : '0');
  const [level, setLevel] = useState(existingCourse?.level || 'BEGINNER');
  const [categoryId, setCategoryId] = useState(existingCourse?.category_id ? String(existingCourse.category_id) : '1');
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(existingCourse?.thumbnail_url || null);

  // Chọn ảnh local từ thư viện máy
  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Quyền truy cập', 'Bạn cần cấp quyền truy cập bộ sưu tập để chọn ảnh thumbnail.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setThumbnailUri(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Lỗi xác thực', 'Tiêu đề khóa học không được để trống.');
      return;
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      Alert.alert('Lỗi xác thực', 'Giá khóa học phải lớn hơn hoặc bằng 0.');
      return;
    }

    Alert.alert(
      'Thành công',
      isEdit ? 'Đã cập nhật thông tin khóa học!' : 'Đã tạo khóa học mới thành công (trạng thái DRAFT)!',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Trở về</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Thumbnail Preview & Picker */}
        <Text style={styles.label}>Ảnh đại diện khóa học (Thumbnail)</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
          {thumbnailUri ? (
            <Image source={{ uri: thumbnailUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderIcon}>📷</Text>
              <Text style={styles.placeholderText}>Nhấn để chọn ảnh từ thiết bị</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Tiêu đề */}
        <Text style={styles.label}>Tiêu đề khóa học *</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập tên khóa học..."
          value={title}
          onChangeText={setTitle}
        />

        {/* Mô tả */}
        <Text style={styles.label}>Mô tả khóa học</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Mô tả nội dung, mục tiêu khóa học..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        {/* Giá */}
        <Text style={styles.label}>Giá (VNĐ) *</Text>
        <TextInput
          style={styles.input}
          placeholder="0 = Miễn phí"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />

        {/* Level */}
        <Text style={styles.label}>Trình độ</Text>
        <View style={styles.levelRow}>
          {['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS'].map((lvl) => (
            <TouchableOpacity
              key={lvl}
              style={[styles.levelOption, level === lvl && styles.levelOptionSelected]}
              onPress={() => setLevel(lvl)}
            >
              <Text style={[styles.levelOptionText, level === lvl && styles.levelOptionTextSelected]}>
                {lvl}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category ID */}
        <Text style={styles.label}>Category ID</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập mã danh mục..."
          value={categoryId}
          onChangeText={setCategoryId}
          keyboardType="numeric"
        />

        {/* Nút lưu */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{isEdit ? 'Lưu thay đổi' : 'Tạo bản nháp'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  backButton: { fontSize: 16, color: '#2563EB', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  scrollContent: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#F9FAFB',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  imagePicker: {
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: { width: '100%', height: '100%' },
  placeholderContainer: { alignItems: 'center' },
  placeholderIcon: { fontSize: 32, marginBottom: 6 },
  placeholderText: { color: '#6B7280', fontSize: 14 },
  levelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  levelOption: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  levelOptionSelected: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  levelOptionText: { fontSize: 12, color: '#4B5563', fontWeight: '500' },
  levelOptionTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 28,
    marginBottom: 40,
    alignItems: 'center',
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});