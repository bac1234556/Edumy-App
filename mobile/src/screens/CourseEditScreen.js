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
import RejectionBanner from '../components/common/RejectionBanner';

const errorText = (err, fallback) => err?.response?.data?.message || fallback;

export const CourseEditScreen = ({ route, navigation }) => {
  const { courseId } = route.params || {};

  const [course, setCourse] = useState(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadCourse = useCallback(async () => {
    if (!courseId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await instructorApi.getCourseDetail(courseId);
      const data = res.data?.data || null;
      setCourse(data);
      if (data) {
        setTitle(data.title || '');
        setSubtitle(data.subtitle || '');
        setDescription(data.description || '');
        setPrice(data.price !== undefined && data.price !== null ? String(data.price) : '0');
      }
    } catch (err) {
      setError(errorText(err, 'Không thể tải thông tin khóa học'));
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener ? navigation.addListener('focus', loadCourse) : null;
    loadCourse();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [navigation, loadCourse]);

  // Kiểm tra dữ liệu, gọi PUT và trả về khóa học đã cập nhật (null nếu không lưu được).
  // Payload không có trường status: trạng thái khóa học do luồng gửi duyệt/phê duyệt quyết định.
  const saveCourse = async () => {
    if (!title.trim()) {
      Alert.alert('Lỗi xác thực', 'Tiêu đề khóa học không được để trống.');
      return null;
    }
    const numPrice = Number(price);
    if (price.trim() === '' || Number.isNaN(numPrice) || numPrice < 0) {
      Alert.alert('Lỗi xác thực', 'Giá khóa học phải lớn hơn hoặc bằng 0.');
      return null;
    }
    const res = await instructorApi.updateCourse(courseId, {
      title: title.trim(),
      subtitle: subtitle.trim(),
      description,
      price: numPrice,
    });
    const updated = res.data?.data || null;
    if (updated) setCourse(updated);
    return updated || course;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const saved = await saveCourse();
      if (!saved) return;
      Alert.alert(
        'Thành công',
        saved.status === 'PUBLISHED'
          ? 'Đã lưu thay đổi. Khóa học vẫn ở trạng thái đã xuất bản.'
          : 'Đã lưu thay đổi khóa học.'
      );
    } catch (err) {
      Alert.alert('Không thể lưu', errorText(err, 'Vui lòng thử lại'));
    } finally {
      setSaving(false);
    }
  };

  const handleResubmit = () => {
    Alert.alert(
      'Gửi duyệt lại',
      'Thay đổi sẽ được lưu và khóa học được gửi lại cho quản trị viên phê duyệt. Bạn có muốn tiếp tục?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gửi duyệt lại',
          onPress: async () => {
            try {
              setSaving(true);
              const saved = await saveCourse();
              if (!saved) return;
              await instructorApi.submitForReview(courseId);
              Alert.alert('Thành công', 'Khóa học đã được gửi duyệt lại (PENDING)!', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err) {
              Alert.alert('Không thể gửi duyệt lại', errorText(err, 'Vui lòng kiểm tra lại điều kiện'));
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert('Xóa khóa học', 'Bạn có chắc muốn xóa khóa học này? Hành động không thể hoàn tác.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            setSaving(true);
            await instructorApi.deleteCourse(courseId);
            Alert.alert('Đã xóa', 'Khóa học đã được xóa.', [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
          } catch (err) {
            // Khóa học đã có học viên: backend trả 409 kèm thông báo dễ hiểu.
            Alert.alert('Không thể xóa khóa học', errorText(err, 'Vui lòng thử lại'));
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  // 1. Loading State
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.stateMsg}>Đang tải thông tin khóa học...</Text>
      </View>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Đã có lỗi xảy ra</Text>
        <Text style={styles.stateMsg}>{error}</Text>
        <TouchableOpacity style={styles.btnRetry} onPress={loadCourse}>
          <Text style={styles.btnRetryText}>Tải lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 3. Empty State
  if (!course) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>Không tìm thấy khóa học</Text>
        <Text style={styles.stateMsg}>Khóa học không tồn tại hoặc bạn không có quyền truy cập.</Text>
        <TouchableOpacity style={styles.btnRetry} onPress={() => navigation.goBack()}>
          <Text style={styles.btnRetryText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isRejected = course.status === 'REJECTED';
  const isPublished = course.status === 'PUBLISHED';
  const isPending = course.status === 'PENDING';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Trở về</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Chỉnh sửa khóa học</Text>
        <View style={{ width: 40 }} />
      </View>

      {isRejected && <RejectionBanner reason={course.rejectionReason} />}

      {isPublished && (
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            Khóa học đã xuất bản. Thay đổi được lưu trực tiếp và không làm đổi trạng thái khóa học.
          </Text>
        </View>
      )}

      {isPending && (
        <View style={styles.lockBanner}>
          <Text style={styles.lockBannerText}>
            Khóa học đang chờ duyệt. Bạn chỉ có quyền xem thông tin.
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.label}>Tiêu đề khóa học *</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập tên khóa học..."
          value={title}
          onChangeText={setTitle}
          editable={!isPending}
        />

        <Text style={styles.label}>Phụ đề</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập phụ đề khóa học..."
          value={subtitle}
          onChangeText={setSubtitle}
          editable={!isPending}
        />

        <Text style={styles.label}>Mô tả khóa học</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Mô tả nội dung, mục tiêu khóa học..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          editable={!isPending}
        />

        <Text style={styles.label}>Giá (VNĐ) *</Text>
        <TextInput
          style={styles.input}
          placeholder="0 = Miễn phí"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          editable={!isPending}
        />

        <TouchableOpacity
          style={styles.btnCurriculum}
          onPress={() => navigation.navigate('CurriculumEditor', { courseId })}
        >
          <Text style={styles.btnCurriculumText}>Quản lý nội dung (Curriculum) →</Text>
        </TouchableOpacity>

        {!isPending && (
          <>
            {isRejected && (
              <TouchableOpacity
                style={[styles.btnPrimary, saving && styles.btnDisabled]}
                onPress={handleResubmit}
                disabled={saving}
              >
                <Text style={styles.btnPrimaryText}>🔁 Lưu và gửi duyệt lại</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[isRejected ? styles.btnSecondary : styles.btnPrimary, saving && styles.btnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={isRejected ? '#2563EB' : '#FFFFFF'} />
              ) : (
                <Text style={isRejected ? styles.btnSecondaryText : styles.btnPrimaryText}>
                  {isRejected ? 'Chỉ lưu thay đổi' : 'Lưu thay đổi'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnDelete} onPress={handleDelete} disabled={saving}>
              <Text style={styles.btnDeleteText}>Xóa khóa học</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
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
  infoBanner: { backgroundColor: '#DBEAFE', padding: 10 },
  infoBannerText: { color: '#1E40AF', fontSize: 13, fontWeight: '600' },
  lockBanner: { backgroundColor: '#FEF3C7', padding: 10, alignItems: 'center' },
  lockBannerText: { color: '#92400E', fontSize: 13, fontWeight: '600' },
  scrollContent: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  btnCurriculum: { marginTop: 16, alignSelf: 'flex-start' },
  btnCurriculumText: { fontSize: 14, color: '#2563EB', fontWeight: '600' },
  btnPrimary: { backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  btnSecondary: {
    borderWidth: 1,
    borderColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  btnSecondaryText: { color: '#2563EB', fontSize: 15, fontWeight: '600' },
  btnDisabled: { opacity: 0.6 },
  btnDelete: { paddingVertical: 12, alignItems: 'center', marginTop: 16, marginBottom: 40 },
  btnDeleteText: { color: '#DC2626', fontSize: 14, fontWeight: '600' },
  stateMsg: { fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center' },
  errorTitle: { fontSize: 17, fontWeight: '700', color: '#DC2626' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151' },
  btnRetry: { backgroundColor: '#2563EB', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 6, marginTop: 12 },
  btnRetryText: { color: '#FFFFFF', fontWeight: '600' },
});
