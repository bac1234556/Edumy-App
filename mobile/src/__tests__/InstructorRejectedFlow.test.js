import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { MyCoursesScreen } from '../screens/MyCoursesScreen';
import { CourseEditScreen } from '../screens/CourseEditScreen';
import { CurriculumEditorScreen } from '../screens/CurriculumEditorScreen';
import { instructorApi } from '../api/instructorApi';

jest.mock('../api/instructorApi', () => ({
  instructorApi: {
    getMyCourses: jest.fn(),
    getCourseDetail: jest.fn(),
    updateCourse: jest.fn(),
    deleteCourse: jest.fn(),
    getSections: jest.fn(),
    createSection: jest.fn(),
    submitForReview: jest.fn(),
  },
}));

const REASON = 'Bổ sung nội dung cho chương 2';

const course = (overrides = {}) => ({
  id: 1,
  title: 'Khóa học Spring Boot',
  subtitle: 'Phụ đề',
  description: 'Mô tả',
  price: 150000,
  status: 'REJECTED',
  rejectionReason: REASON,
  ...overrides,
});

describe('Xử lý khóa bị từ chối và quy tắc xóa/sửa', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  describe('CourseEditScreen', () => {
    it('hiển thị banner lý do từ chối và nút gửi duyệt lại khi khóa REJECTED', async () => {
      instructorApi.getCourseDetail.mockResolvedValueOnce({ data: { data: course() } });

      const { getByText, queryByText } = render(
        <CourseEditScreen route={{ params: { courseId: 1 } }} navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Khóa học bị từ chối')).toBeTruthy();
        expect(getByText(`Lý do: ${REASON}`)).toBeTruthy();
        expect(getByText('🔁 Lưu và gửi duyệt lại')).toBeTruthy();
      });
      expect(queryByText('Lưu thay đổi')).toBeNull();
    });

    it('sửa rồi gửi duyệt lại: gọi PUT (không kèm status) rồi gọi submit-review', async () => {
      instructorApi.getCourseDetail.mockResolvedValueOnce({ data: { data: course() } });
      instructorApi.updateCourse.mockResolvedValueOnce({ data: { data: course({ title: 'Tên mới' }) } });
      instructorApi.submitForReview.mockResolvedValueOnce({ data: { data: course({ status: 'PENDING' }) } });

      const { getByText, getByPlaceholderText } = render(
        <CourseEditScreen route={{ params: { courseId: 1 } }} navigation={mockNavigation} />
      );

      await waitFor(() => expect(getByText('🔁 Lưu và gửi duyệt lại')).toBeTruthy());

      fireEvent.changeText(getByPlaceholderText('Nhập tên khóa học...'), 'Tên mới');
      fireEvent.press(getByText('🔁 Lưu và gửi duyệt lại'));

      const confirmButtons = Alert.alert.mock.calls[0][2];
      await act(async () => {
        await confirmButtons[1].onPress();
      });

      expect(instructorApi.updateCourse).toHaveBeenCalledTimes(1);
      const [calledId, payload] = instructorApi.updateCourse.mock.calls[0];
      expect(calledId).toBe(1);
      expect(payload.title).toBe('Tên mới');
      expect(payload).not.toHaveProperty('status');
      expect(instructorApi.submitForReview).toHaveBeenCalledWith(1);
    });

    it('khóa PUBLISHED: chỉ có nút lưu thay đổi, lưu không kèm status', async () => {
      instructorApi.getCourseDetail.mockResolvedValueOnce({
        data: { data: course({ status: 'PUBLISHED', rejectionReason: null }) },
      });
      instructorApi.updateCourse.mockResolvedValueOnce({
        data: { data: course({ status: 'PUBLISHED', rejectionReason: null }) },
      });

      const { getByText, queryByText } = render(
        <CourseEditScreen route={{ params: { courseId: 1 } }} navigation={mockNavigation} />
      );

      await waitFor(() => expect(getByText('Lưu thay đổi')).toBeTruthy());
      expect(queryByText('Khóa học bị từ chối')).toBeNull();
      expect(queryByText('🔁 Lưu và gửi duyệt lại')).toBeNull();

      await act(async () => {
        fireEvent.press(getByText('Lưu thay đổi'));
      });

      await waitFor(() => expect(instructorApi.updateCourse).toHaveBeenCalledTimes(1));
      expect(instructorApi.updateCourse.mock.calls[0][1]).not.toHaveProperty('status');
      expect(instructorApi.submitForReview).not.toHaveBeenCalled();
    });

    it('xóa khóa đã có học viên: hiển thị thông báo từ backend (409)', async () => {
      const message = 'Khóa học đã có học viên đăng ký nên không thể xóa. Bạn vẫn có thể chỉnh sửa nội dung khóa học.';
      instructorApi.getCourseDetail.mockResolvedValueOnce({
        data: { data: course({ status: 'PUBLISHED', rejectionReason: null }) },
      });
      instructorApi.deleteCourse.mockRejectedValueOnce({ response: { status: 409, data: { success: false, message } } });

      const { getByText } = render(
        <CourseEditScreen route={{ params: { courseId: 1 } }} navigation={mockNavigation} />
      );

      await waitFor(() => expect(getByText('Xóa khóa học')).toBeTruthy());
      fireEvent.press(getByText('Xóa khóa học'));

      const confirmButtons = Alert.alert.mock.calls[0][2];
      await act(async () => {
        await confirmButtons[1].onPress();
      });

      expect(instructorApi.deleteCourse).toHaveBeenCalledWith(1);
      expect(Alert.alert).toHaveBeenLastCalledWith('Không thể xóa khóa học', message);
    });

    it('hiển thị trạng thái lỗi và cho tải lại', async () => {
      instructorApi.getCourseDetail.mockRejectedValueOnce({ response: { data: { message: 'Lỗi máy chủ' } } });

      const { getByText } = render(
        <CourseEditScreen route={{ params: { courseId: 1 } }} navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Đã có lỗi xảy ra')).toBeTruthy();
        expect(getByText('Lỗi máy chủ')).toBeTruthy();
        expect(getByText('Tải lại')).toBeTruthy();
      });
    });

    it('hiển thị trạng thái rỗng khi không có dữ liệu khóa học', async () => {
      instructorApi.getCourseDetail.mockResolvedValueOnce({ data: { data: null } });

      const { getByText } = render(
        <CourseEditScreen route={{ params: { courseId: 1 } }} navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Không tìm thấy khóa học')).toBeTruthy();
      });
    });

    it('hiển thị trạng thái loading khi đang tải', () => {
      instructorApi.getCourseDetail.mockReturnValueOnce(new Promise(() => {}));

      const { getByText } = render(
        <CourseEditScreen route={{ params: { courseId: 1 } }} navigation={mockNavigation} />
      );

      expect(getByText('Đang tải thông tin khóa học...')).toBeTruthy();
    });
  });

  describe('CurriculumEditorScreen', () => {
    it('khóa REJECTED: hiện banner lý do và cho gửi duyệt lại', async () => {
      instructorApi.getCourseDetail.mockResolvedValueOnce({ data: { data: course() } });
      instructorApi.getSections.mockResolvedValueOnce({ data: { data: [{ id: 10, title: 'Khởi tạo dự án' }] } });

      const { getByText, getByPlaceholderText } = render(
        <CurriculumEditorScreen route={{ params: { courseId: 1 } }} navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText(`Lý do: ${REASON}`)).toBeTruthy();
        expect(getByText('🔁 Gửi duyệt lại')).toBeTruthy();
        expect(getByPlaceholderText('Nhập tiêu đề chương mới...')).toBeTruthy();
      });
    });

    it('khóa PUBLISHED: chỉ xem nội dung, không có nút gửi duyệt', async () => {
      instructorApi.getCourseDetail.mockResolvedValueOnce({
        data: { data: course({ status: 'PUBLISHED', rejectionReason: null }) },
      });
      instructorApi.getSections.mockResolvedValueOnce({ data: { data: [] } });

      const { getByText, queryByText } = render(
        <CurriculumEditorScreen route={{ params: { courseId: 1 } }} navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText(/Bạn chỉ có quyền xem nội dung/)).toBeTruthy();
      });
      expect(queryByText('🔁 Gửi duyệt lại')).toBeNull();
      expect(queryByText('🚀 Gửi phê duyệt khóa học')).toBeNull();
    });
  });

  describe('MyCoursesScreen', () => {
    it('khóa REJECTED hiển thị lý do từ chối và lối vào màn hình chỉnh sửa', async () => {
      instructorApi.getMyCourses.mockResolvedValueOnce({ data: { data: [course()] } });

      const { getByText } = render(<MyCoursesScreen navigation={mockNavigation} />);

      await waitFor(() => {
        expect(getByText('Khóa học Spring Boot')).toBeTruthy();
        expect(getByText('Từ chối')).toBeTruthy();
        expect(getByText(`Lý do từ chối: ${REASON}`)).toBeTruthy();
      });

      fireEvent.press(getByText('Chỉnh sửa'));
      expect(mockNavigation.navigate).toHaveBeenCalledWith('CourseEdit', { courseId: 1 });
    });
  });
});
