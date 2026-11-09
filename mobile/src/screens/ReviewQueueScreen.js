import React, { useState } from 'react';
import { Linking, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Dialog,
  Divider,
  Portal,
  Text,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorMessage } from '../api/client';
import {
  approveCourse,
  fetchAdminCourseDetail,
  fetchPendingCourses,
  rejectCourse,
} from '../api/adminCourses';

const QUEUE_QUERY_KEY = ['admin', 'pending-courses'];

function Centered({ children }) {
  return <View style={styles.centered}>{children}</View>;
}

function formatPrice(price) {
  const value = Number(price);
  return Number.isFinite(value) ? `${value.toLocaleString('vi-VN')} ₫` : 'Chưa cập nhật';
}

export function ReviewQueueScreen({ onBack }) {
  const queryClient = useQueryClient();
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [videoError, setVideoError] = useState('');

  const queue = useInfiniteQuery({
    queryKey: QUEUE_QUERY_KEY,
    queryFn: ({ pageParam = 0 }) => fetchPendingCourses({ page: pageParam, size: 50 }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.page + 1 < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });

  const detail = useQuery({
    queryKey: ['admin', 'course-review', selectedCourseId],
    queryFn: () => fetchAdminCourseDetail(selectedCourseId),
    enabled: selectedCourseId !== null,
  });

  const removeFromQueue = (courseId) => {
    queryClient.setQueryData(QUEUE_QUERY_KEY, (current) => {
      if (!current) return current;
      return {
        ...current,
        pages: current.pages.map((page) => ({
          ...page,
          content: page.content.filter((course) => course.id !== courseId),
          totalElements: Math.max(0, page.totalElements - 1),
        })),
      };
    });
    queryClient.invalidateQueries({ queryKey: QUEUE_QUERY_KEY });
  };

  const approveMutation = useMutation({
    mutationFn: () => approveCourse(selectedCourseId),
    onSuccess: () => {
      removeFromQueue(selectedCourseId);
      setSuccessMessage('Đã phê duyệt khóa học.');
      setSelectedCourseId(null);
      setShowApproveDialog(false);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectCourse(selectedCourseId, rejectionReason.trim()),
    onSuccess: () => {
      removeFromQueue(selectedCourseId);
      setSuccessMessage('Đã từ chối khóa học.');
      setSelectedCourseId(null);
      setShowRejectDialog(false);
      setRejectionReason('');
    },
  });

  const courses = queue.data?.pages.flatMap((page) => page.content) ?? [];
  const selectedCourse = courses.find((course) => course.id === selectedCourseId);
  const detailError = detail.isError ? errorMessage(detail.error) : null;

  const handleOpenVideo = async (videoUrl) => {
    setVideoError('');
    try {
      if (!/^https?:\/\//i.test(videoUrl)) {
        throw new Error('Liên kết video không hợp lệ.');
      }
      await Linking.openURL(videoUrl);
    } catch (error) {
      setVideoError(error?.message || 'Không thể mở video bài học.');
    }
  };

  const renderQueue = () => {
    if (queue.isPending) {
      return (
        <Centered>
          <ActivityIndicator accessibilityLabel="Đang tải hàng chờ duyệt" />
          <Text>Đang tải khóa học chờ duyệt...</Text>
        </Centered>
      );
    }

    if (queue.isError) {
      return (
        <Centered>
          <Text variant="titleMedium">Không tải được hàng chờ duyệt</Text>
          <Text accessibilityRole="alert">{errorMessage(queue.error)}</Text>
          <Button mode="contained" onPress={() => queue.refetch()}>
            Thử lại
          </Button>
        </Centered>
      );
    }

    if (courses.length === 0) {
      return (
        <Centered>
          <Text variant="headlineSmall">Hàng chờ đang trống</Text>
          <Text>Hiện không có khóa học nào cần kiểm duyệt.</Text>
        </Centered>
      );
    }

    return (
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={queue.isRefetching && !queue.isFetchingNextPage}
            onRefresh={() => queue.refetch()}
          />
        }
        onScrollBeginDrag={() => setSuccessMessage('')}
      >
        {courses.map((course) => (
          <Card key={course.id} mode="outlined" style={styles.courseCard}>
            <Card.Content style={styles.courseContent}>
              <Text variant="titleMedium">{course.title}</Text>
              {course.subtitle ? <Text>{course.subtitle}</Text> : null}
              <Text>Giảng viên: {course.instructorName || 'Chưa cập nhật'}</Text>
              <Text>Danh mục: {course.categoryName || 'Chưa phân loại'}</Text>
              <Text>Giá: {formatPrice(course.price)}</Text>
              <Button
                mode="contained-tonal"
                onPress={() => {
                  setSuccessMessage('');
                  setVideoError('');
                  approveMutation.reset();
                  rejectMutation.reset();
                  setSelectedCourseId(course.id);
                }}
              >
                Xem chi tiết
              </Button>
            </Card.Content>
          </Card>
        ))}
        {queue.hasNextPage ? (
          <Button
            mode="outlined"
            loading={queue.isFetchingNextPage}
            disabled={queue.isFetchingNextPage}
            onPress={() => queue.fetchNextPage()}
          >
            Tải thêm khóa học
          </Button>
        ) : null}
      </ScrollView>
    );
  };

  const renderDetail = () => {
    if (detail.isPending) {
      return (
        <Centered>
          <ActivityIndicator accessibilityLabel="Đang tải chi tiết khóa học" />
          <Text>Đang tải chi tiết khóa học...</Text>
        </Centered>
      );
    }

    if (detail.isError) {
      return (
        <Centered>
          <Text variant="titleMedium">Không tải được chi tiết khóa học</Text>
          <Text accessibilityRole="alert">{detailError}</Text>
          <Button mode="contained" onPress={() => detail.refetch()}>
            Thử lại
          </Button>
        </Centered>
      );
    }

    const course = detail.data;
    return (
      <ScrollView contentContainerStyle={styles.detailContent}>
        <Text variant="headlineSmall">{course.title}</Text>
        {course.subtitle ? <Text variant="titleMedium">{course.subtitle}</Text> : null}
        <Text>Giảng viên: {course.instructor?.fullName || selectedCourse?.instructorName || 'Chưa cập nhật'}</Text>
        <Text>Danh mục: {course.category?.name || selectedCourse?.categoryName || 'Chưa phân loại'}</Text>
        <Text>Trình độ: {course.level || 'Chưa cập nhật'}</Text>
        <Text>Giá: {formatPrice(course.price)}</Text>
        {course.description ? <Text>{course.description}</Text> : null}

        <Text variant="titleLarge" style={styles.sectionTitle}>Giáo trình</Text>
        {course.curriculum?.length ? course.curriculum.map((section) => (
          <Card key={section.id} mode="outlined" style={styles.sectionCard}>
            <Card.Content style={styles.courseContent}>
              <Text variant="titleMedium">{section.orderIndex}. {section.title}</Text>
              {section.lessons?.length ? section.lessons.map((lesson) => (
                <View key={lesson.id} style={styles.lesson}>
                  <Text>{lesson.orderIndex}. {lesson.title}</Text>
                  <Text variant="bodySmall">
                    {lesson.durationSeconds ? `${Math.ceil(lesson.durationSeconds / 60)} phút` : 'Chưa có thời lượng'}
                    {lesson.isPreview ? ' · Bài học xem trước' : ''}
                  </Text>
                  {lesson.videoUrl ? (
                    <Button compact onPress={() => handleOpenVideo(lesson.videoUrl)}>
                      Mở video bài học
                    </Button>
                  ) : (
                    <Text variant="bodySmall">Chưa có video</Text>
                  )}
                  <Divider />
                </View>
              )) : <Text>Chưa có bài học trong chương này.</Text>}
            </Card.Content>
          </Card>
        )) : <Text>Khóa học chưa có chương nào.</Text>}

        {videoError ? (
          <Text accessibilityRole="alert" style={styles.errorText}>{videoError}</Text>
        ) : null}
        <View style={styles.actions}>
          <Button
            mode="contained"
            loading={approveMutation.isPending}
            disabled={approveMutation.isPending || rejectMutation.isPending}
            onPress={() => setShowApproveDialog(true)}
          >
            Phê duyệt
          </Button>
          <Button
            mode="outlined"
            disabled={approveMutation.isPending || rejectMutation.isPending}
            onPress={() => {
              setRejectionReason('');
              rejectMutation.reset();
              setShowRejectDialog(true);
            }}
          >
            Từ chối
          </Button>
        </View>
        {approveMutation.isError ? (
          <Text accessibilityRole="alert" style={styles.errorText}>
            {errorMessage(approveMutation.error)}
          </Text>
        ) : null}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Button onPress={() => {
          if (selectedCourseId !== null) {
            setSelectedCourseId(null);
            return;
          }
          onBack?.();
        }}>
          {selectedCourseId !== null ? '← Hàng chờ' : '← Quay lại'}
        </Button>
        <Text variant="titleLarge" style={styles.headerTitle}>
          {selectedCourseId !== null ? 'Chi tiết kiểm duyệt' : 'Hàng chờ duyệt'}
        </Text>
        {selectedCourseId === null ? (
          <Button compact onPress={() => queue.refetch()} disabled={queue.isRefetching}>
            Làm mới
          </Button>
        ) : <View style={styles.headerSpacer} />}
      </View>

      {successMessage && selectedCourseId === null ? (
        <Text style={styles.successMessage}>{successMessage}</Text>
      ) : null}
      {selectedCourseId === null ? renderQueue() : renderDetail()}

      <Portal>
        <Dialog
          visible={showApproveDialog}
          onDismiss={() => setShowApproveDialog(false)}
          dismissable={!approveMutation.isPending}
        >
          <Dialog.Title>Xác nhận phê duyệt</Dialog.Title>
          <Dialog.Content>
            <Text>
              Phê duyệt khóa học “{selectedCourse?.title || detail.data?.title}”? Khóa học sẽ được xuất bản.
            </Text>
            {approveMutation.isError ? (
              <Text accessibilityRole="alert" style={styles.errorText}>
                {errorMessage(approveMutation.error)}
              </Text>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowApproveDialog(false)} disabled={approveMutation.isPending}>
              Hủy
            </Button>
            <Button
              onPress={() => approveMutation.mutate()}
              loading={approveMutation.isPending}
              disabled={approveMutation.isPending}
            >
              Xác nhận duyệt
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={showRejectDialog}
          onDismiss={() => {
            if (!rejectMutation.isPending) setShowRejectDialog(false);
          }}
          dismissable={!rejectMutation.isPending}
        >
          <Dialog.Title>Từ chối khóa học</Dialog.Title>
          <Dialog.Content>
            <Text>Vui lòng nhập lý do để giảng viên biết nội dung cần chỉnh sửa.</Text>
            <TextInput
              label="Lý do từ chối (bắt buộc)"
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              maxLength={1000}
              accessibilityLabel="Lý do từ chối"
              style={styles.reasonInput}
            />
            {rejectMutation.isError ? (
              <Text accessibilityRole="alert" style={styles.errorText}>
                {errorMessage(rejectMutation.error)}
              </Text>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowRejectDialog(false)} disabled={rejectMutation.isPending}>
              Hủy
            </Button>
            <Button
              onPress={() => rejectMutation.mutate()}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
              loading={rejectMutation.isPending}
            >
              Xác nhận từ chối
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: { flex: 1, textAlign: 'center' },
  headerSpacer: { width: 60 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  listContent: { padding: 16, gap: 12 },
  detailContent: { padding: 16, gap: 12 },
  courseCard: { backgroundColor: '#FFFFFF' },
  sectionCard: { backgroundColor: '#FFFFFF' },
  courseContent: { gap: 8 },
  sectionTitle: { marginTop: 12 },
  lesson: { gap: 4, paddingVertical: 8 },
  actions: { gap: 10, paddingVertical: 12 },
  reasonInput: { marginTop: 16, maxHeight: 180 },
  errorText: { color: '#B91C1C', marginTop: 8 },
  successMessage: { padding: 12, color: '#166534', backgroundColor: '#DCFCE7' },
});
