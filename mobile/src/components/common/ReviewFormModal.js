import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { createReview, updateReview } from '../../api/reviews';

export const ReviewFormModal = ({
  visible,
  courseId,
  initialReview = null,
  onClose,
  onSubmitSuccess,
}) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialReview) {
      setRating(initialReview.rating || 5);
      setComment(initialReview.comment || '');
    } else {
      setRating(5);
      setComment('');
    }
  }, [initialReview, visible]);

  const handleSubmit = async () => {
    if (!rating || rating < 1 || rating > 5) {
      Alert.alert('Lỗi', 'Vui lòng chọn từ 1 đến 5 sao');
      return;
    }

    setIsSubmitting(true);
    try {
      let result;
      if (initialReview && initialReview.id) {
        result = await updateReview(courseId, { rating, comment: comment.trim() });
      } else {
        result = await createReview(courseId, { rating, comment: comment.trim() });
      }
      Alert.alert('Thành công', initialReview ? 'Cập nhật đánh giá thành công!' : 'Cảm ơn bạn đã gửi đánh giá!');
      if (onSubmitSuccess) {
        onSubmitSuccess(result);
      }
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không thể gửi đánh giá';
      Alert.alert('Lỗi', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {initialReview ? 'Chỉnh sửa đánh giá' : 'Đánh giá khóa học'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Star selector */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                activeOpacity={0.7}
                style={styles.starTouch}
              >
                <Text style={[styles.starText, star <= rating ? styles.starFilled : styles.starEmpty]}>
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingHint}>
            {rating === 5 && 'Tuyệt vời, vượt mong đợi!'}
            {rating === 4 && 'Rất tốt, nội dung hữu ích'}
            {rating === 3 && 'Tạm ổn, cần cải thiện thêm'}
            {rating === 2 && 'Chưa hài lòng'}
            {rating === 1 && 'Rất thất vọng'}
          </Text>

          {/* Comment input */}
          <Text style={styles.inputLabel}>Nhận xét của bạn (không bắt buộc)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Chia sẻ cảm nhận của bạn về khóa học này..."
            placeholderTextColor="#94A3B8"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={1000}
          />

          {/* Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {initialReview ? 'Cập nhật' : 'Gửi đánh giá'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    fontSize: 20,
    color: '#64748B',
    fontWeight: 'bold',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  starTouch: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  starText: {
    fontSize: 38,
  },
  starFilled: {
    color: '#F59E0B',
  },
  starEmpty: {
    color: '#E2E8F0',
  },
  ratingHint: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 13,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    color: '#0F172A',
    fontSize: 14,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 14,
  },
  submitBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    minWidth: 120,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
