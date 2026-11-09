import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { instructorApi } from '../api/instructorApi';

export const CurriculumEditorScreen = ({ route, navigation }) => {
  const { courseId } = route.params || {};

  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isReadOnly = course && course.status !== 'DRAFT';

  const loadData = useCallback(async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      const [courseRes, sectionsRes] = await Promise.all([
        instructorApi.getCourseDetail(courseId),
        instructorApi.getSections(courseId),
      ]);
      setCourse(courseRes.data?.data || null);
      setSections(sectionsRes.data?.data || []);
    } catch (err) {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể tải nội dung khóa học');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Thêm Section
  const handleAddSection = async () => {
    if (!newSectionTitle.trim()) {
      Alert.alert('Lỗi', 'Tên chương không được để trống');
      return;
    }
    try {
      await instructorApi.createSection(courseId, newSectionTitle.trim());
      setNewSectionTitle('');
      loadData();
    } catch (err) {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể thêm chương');
    }
  };

  // Gửi duyệt khóa học
  const handleSubmitForReview = async () => {
    Alert.alert(
      'Xác nhận gửi duyệt',
      'Sau khi gửi phê duyệt, bạn sẽ không thể chỉnh sửa nội dung khóa học cho đến khi có phản hồi. Bạn có muốn tiếp tục?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gửi duyệt',
          onPress: async () => {
            try {
              setSubmitting(true);
              await instructorApi.submitForReview(courseId);
              Alert.alert('Thành công', 'Khóa học đã được chuyển sang trạng thái chờ duyệt (PENDING)!', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err) {
              Alert.alert('Không thể gửi duyệt', err.response?.data?.message || 'Vui lòng kiểm tra lại điều kiện');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ marginTop: 8, color: '#6B7280' }}>Đang tải curriculum...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Trở về</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{course?.title || 'Chỉnh sửa giáo trình'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Thông báo Read-only nếu không phải DRAFT */}
      {isReadOnly && (
        <View style={styles.lockBanner}>
          <Text style={styles.lockBannerText}>
            Khóa học đang ở trạng thái {course?.status}. Bạn chỉ có quyền xem nội dung.
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Form thêm Section */}
        {!isReadOnly && (
          <View style={styles.addSectionBox}>
            <TextInput
              style={styles.input}
              placeholder="Nhập tiêu đề chương mới..."
              value={newSectionTitle}
              onChangeText={setNewSectionTitle}
            />
            <TouchableOpacity style={styles.btnAddSection} onPress={handleAddSection}>
              <Text style={styles.btnAddSectionText}>+ Thêm chương</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Danh sách các Section */}
        {sections.map((section, idx) => (
          <View key={section.id} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Chương {idx + 1}: {section.title}</Text>

            {!isReadOnly && (
              <TouchableOpacity
                style={styles.btnAddLesson}
                onPress={() =>
                  navigation.navigate('LessonMediaUpload', {
                    sectionId: section.id,
                    onSuccess: loadData,
                  })
                }
              >
                <Text style={styles.btnAddLessonText}>+ Đính kèm bài học / Video</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Nút gửi phê duyệt */}
        {!isReadOnly && (
          <TouchableOpacity
            style={[styles.btnSubmit, submitting && { backgroundColor: '#9CA3AF' }]}
            onPress={handleSubmitForReview}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.btnSubmitText}>🚀 Gửi phê duyệt khóa học</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  backBtn: { fontSize: 15, color: '#2563EB', fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  lockBanner: { backgroundColor: '#FEF3C7', padding: 10, alignItems: 'center' },
  lockBannerText: { color: '#92400E', fontSize: 13, fontWeight: '600' },
  addSectionBox: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  input: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, height: 44 },
  btnAddSection: { backgroundColor: '#2563EB', justifyContent: 'center', paddingHorizontal: 14, borderRadius: 8 },
  btnAddSectionText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  sectionCard: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 10 },
  btnAddLesson: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#EFF6FF', borderRadius: 6, alignSelf: 'flex-start' },
  btnAddLessonText: { fontSize: 13, color: '#1D4ED8', fontWeight: '600' },
  btnSubmit: { backgroundColor: '#059669', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  btnSubmitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
