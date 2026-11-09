import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import {
  approveCourse,
  fetchAdminCourseDetail,
  fetchPendingCourses,
  rejectCourse,
} from '../api/adminCourses';
import { ReviewQueueScreen } from '../screens/ReviewQueueScreen';

jest.mock('../api/adminCourses', () => ({
  approveCourse: jest.fn(),
  fetchAdminCourseDetail: jest.fn(),
  fetchPendingCourses: jest.fn(),
  rejectCourse: jest.fn(),
}));

jest.mock('../api/client', () => ({
  errorMessage: (error) => error.response?.data?.message || error.message || 'Lỗi kết nối',
}));

const pendingCourse = {
  id: 8,
  title: 'Khóa học chờ duyệt',
  instructorName: 'Nguyễn Giảng Viên',
  categoryName: 'Lập trình',
  price: 250000,
};

const courseDetail = {
  ...pendingCourse,
  description: 'Mô tả khóa học',
  level: 'BEGINNER',
  curriculum: [{
    id: 2,
    title: 'Chương 1',
    orderIndex: 1,
    lessons: [{
      id: 3,
      title: 'Bài học 1',
      orderIndex: 1,
      videoUrl: 'https://example.com/lesson.mp4',
      durationSeconds: 240,
      isPreview: true,
    }],
  }],
};

function renderScreen() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={client}>
      <PaperProvider theme={{ ...MD3LightTheme, animation: { scale: 0 } }}>
        <ReviewQueueScreen onBack={jest.fn()} />
      </PaperProvider>
    </QueryClientProvider>
  );
  return { ...view, client };
}

const page = (content) => ({ content, page: 0, size: 50, totalElements: content.length, totalPages: content.length ? 1 : 0 });

describe('ReviewQueueScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows a loading state while the review queue is loading', () => {
    fetchPendingCourses.mockReturnValue(new Promise(() => {}));
    const view = renderScreen();
    expect(view.getByLabelText('Đang tải hàng chờ duyệt')).toBeTruthy();
  });

  test('shows an empty state when there are no pending courses', async () => {
    fetchPendingCourses.mockResolvedValue(page([]));
    const view = renderScreen();
    expect(await view.findByText('Hàng chờ đang trống')).toBeTruthy();
  });

  test('shows an error and retries loading the queue', async () => {
    fetchPendingCourses
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(page([]));
    const view = renderScreen();
    expect(await view.findByText('Network error')).toBeTruthy();
    fireEvent.press(view.getByText('Thử lại'));
    expect(await view.findByText('Hàng chờ đang trống')).toBeTruthy();
  });

  test('shows course details, curriculum, lesson video action, and review controls', async () => {
    fetchPendingCourses.mockResolvedValue(page([pendingCourse]));
    fetchAdminCourseDetail.mockResolvedValue(courseDetail);
    const view = renderScreen();

    fireEvent.press(await view.findByText('Xem chi tiết'));
    expect(await view.findByText('Mô tả khóa học')).toBeTruthy();
    expect(view.getByText(/Chương 1/)).toBeTruthy();
    expect(view.getByText(/Bài học 1/)).toBeTruthy();
    expect(view.getByText('Mở video bài học')).toBeTruthy();
    expect(view.getByText('Phê duyệt')).toBeTruthy();
    expect(view.getByText('Từ chối')).toBeTruthy();
  });

  test('requires confirmation before approving and removes the course from the queue', async () => {
    fetchPendingCourses
      .mockResolvedValueOnce(page([pendingCourse]))
      .mockResolvedValue(page([]));
    fetchAdminCourseDetail.mockResolvedValue(courseDetail);
    approveCourse.mockResolvedValue({ ...courseDetail, status: 'PUBLISHED' });
    const view = renderScreen();

    fireEvent.press(await view.findByText('Xem chi tiết'));
    fireEvent.press(await view.findByText('Phê duyệt'));
    expect(view.getByText('Xác nhận phê duyệt')).toBeTruthy();
    fireEvent.press(view.getByText('Xác nhận duyệt'));

    await waitFor(() => expect(approveCourse).toHaveBeenCalledWith(pendingCourse.id));
    expect(await view.findByText('Hàng chờ đang trống')).toBeTruthy();
  });

  test('requires a non-empty rejection reason and removes the course after rejection', async () => {
    fetchPendingCourses
      .mockResolvedValueOnce(page([pendingCourse]))
      .mockResolvedValue(page([]));
    fetchAdminCourseDetail.mockResolvedValue(courseDetail);
    rejectCourse.mockResolvedValue({
      ...courseDetail,
      status: 'REJECTED',
      rejectionReason: 'Bổ sung nội dung',
    });
    const view = renderScreen();

    fireEvent.press(await view.findByText('Xem chi tiết'));
    fireEvent.press(await view.findByText('Từ chối'));
    const submitButton = view.getByText('Xác nhận từ chối');
    fireEvent.press(submitButton);
    expect(rejectCourse).not.toHaveBeenCalled();

    fireEvent.changeText(view.getByLabelText('Lý do từ chối'), 'Bổ sung nội dung');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(rejectCourse).toHaveBeenCalledWith(pendingCourse.id, 'Bổ sung nội dung');
    });
    expect(await view.findByText('Hàng chờ đang trống')).toBeTruthy();
  });
});
