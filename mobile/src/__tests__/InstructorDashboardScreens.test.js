import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { InstructorDashboardScreen } from '../screens/InstructorDashboardScreen';
import { InstructorStudentsScreen } from '../screens/InstructorStudentsScreen';
import { instructorApi } from '../api/instructorApi';

jest.mock('../api/instructorApi', () => ({
  instructorApi: {
    getStats: jest.fn(),
    getMyCourses: jest.fn(),
    getCourseStudents: jest.fn(),
  },
}));

const statsResponse = {
  totalCourses: 2,
  totalStudents: 15,
  totalRevenue: 1250000,
  averageRating: 4.5,
};

describe('Instructor dashboard and students screens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the four statistics and course revenue from the API', async () => {
    instructorApi.getStats.mockResolvedValueOnce({ data: { data: statsResponse } });
    instructorApi.getMyCourses.mockResolvedValueOnce({
      data: {
        data: [{ id: 7, title: 'Spring Boot thực chiến', status: 'PUBLISHED', revenue: 850000 }],
      },
    });

    const { getByText } = render(<InstructorDashboardScreen />);

    await waitFor(() => {
      expect(getByText('Tổng khóa học')).toBeTruthy();
      expect(getByText('Tổng học viên')).toBeTruthy();
      expect(getByText('Tổng doanh thu')).toBeTruthy();
      expect(getByText('Đánh giá trung bình')).toBeTruthy();
      expect(getByText('Spring Boot thực chiến')).toBeTruthy();
      expect(getByText('850.000 đ')).toBeTruthy();
    });
    expect(instructorApi.getStats).toHaveBeenCalledTimes(1);
    expect(instructorApi.getMyCourses).toHaveBeenCalledTimes(1);
  });

  it('reloads dashboard statistics and courses when pull-to-refresh is triggered', async () => {
    instructorApi.getStats.mockResolvedValue({ data: { data: statsResponse } });
    instructorApi.getMyCourses.mockResolvedValue({ data: { data: [] } });

    const { getByTestId } = render(<InstructorDashboardScreen />);
    await waitFor(() => expect(instructorApi.getStats).toHaveBeenCalledTimes(1));

    const refreshControl = getByTestId('instructor-dashboard-scroll').props.refreshControl;
    await refreshControl.props.onRefresh();

    await waitFor(() => {
      expect(instructorApi.getStats).toHaveBeenCalledTimes(2);
      expect(instructorApi.getMyCourses).toHaveBeenCalledTimes(2);
    });
  });

  it('shows an empty state when the instructor has no courses', async () => {
    instructorApi.getStats.mockResolvedValueOnce({ data: { data: statsResponse } });
    instructorApi.getMyCourses.mockResolvedValueOnce({ data: { data: [] } });

    const { getByText } = render(<InstructorDashboardScreen />);
    await waitFor(() => expect(getByText('Chưa có khóa học nào')).toBeTruthy());
  });

  it('shows an error state and allows retry when dashboard requests fail', async () => {
    instructorApi.getStats.mockRejectedValueOnce(new Error('Network error'));
    instructorApi.getMyCourses.mockRejectedValueOnce(new Error('Network error'));
    instructorApi.getStats.mockResolvedValueOnce({ data: { data: statsResponse } });
    instructorApi.getMyCourses.mockResolvedValueOnce({ data: { data: [] } });

    const { getByText } = render(<InstructorDashboardScreen />);
    await waitFor(() => expect(getByText('Không thể tải dashboard')).toBeTruthy());
    fireEvent.press(getByText('Thử lại'));
    await waitFor(() => expect(getByText('Thống kê tổng quan')).toBeTruthy());
  });

  it('renders student information and learning progress', async () => {
    instructorApi.getCourseStudents.mockResolvedValueOnce({
      data: {
        data: {
          content: [{
            enrollmentId: 11,
            userId: 4,
            fullName: 'Nguyễn Văn An',
            email: 'an@example.com',
            progressPercent: 75,
            enrolledAt: '2026-11-10T10:00:00',
          }],
          page: 0,
          totalPages: 1,
        },
      },
    });

    const { getByText } = render(<InstructorStudentsScreen courseId="7" onBack={jest.fn()} />);

    await waitFor(() => {
      expect(getByText('Nguyễn Văn An')).toBeTruthy();
      expect(getByText('an@example.com')).toBeTruthy();
      expect(getByText('75%')).toBeTruthy();
    });
    expect(instructorApi.getCourseStudents).toHaveBeenCalledWith('7', 0, 10);
  });

  it('shows the empty state when a course has no students', async () => {
    instructorApi.getCourseStudents.mockResolvedValueOnce({
      data: { data: { content: [], page: 0, totalPages: 0 } },
    });

    const { getByText } = render(<InstructorStudentsScreen courseId="7" onBack={jest.fn()} />);
    await waitFor(() => expect(getByText('Chưa có học viên')).toBeTruthy());
  });
});
