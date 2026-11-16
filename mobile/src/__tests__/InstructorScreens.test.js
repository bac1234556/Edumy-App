import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { MyCoursesScreen } from '../screens/MyCoursesScreen';
import { CurriculumEditorScreen } from '../screens/CurriculumEditorScreen';
import { instructorApi } from '../api/instructorApi';

jest.mock('../api/instructorApi', () => ({
  instructorApi: {
    getMyCourses: jest.fn(),
    getCourseDetail: jest.fn(),
    getSections: jest.fn(),
    createSection: jest.fn(),
    submitForReview: jest.fn(),
  },
}));

describe('Instructor Screens', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('MyCoursesScreen', () => {
    it('renders course list successfully', async () => {
      instructorApi.getMyCourses.mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 1,
              title: 'Lập trình React Native',
              price: 150000,
              status: 'DRAFT',
              thumbnailUrl: 'https://example.com/thumb.jpg',
            },
          ],
        },
      });

      const { getByText, getAllByText } = render(<MyCoursesScreen navigation={mockNavigation} />);

      await waitFor(() => {
        expect(getByText('Lập trình React Native')).toBeTruthy();
        expect(getAllByText('Bản nháp').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('renders empty state when there are no courses', async () => {
      instructorApi.getMyCourses.mockResolvedValueOnce({
        data: { data: [] },
      });

      const { getByText } = render(<MyCoursesScreen navigation={mockNavigation} />);

      await waitFor(() => {
        expect(getByText('Không có khóa học nào')).toBeTruthy();
      });
    });
  });

  describe('CurriculumEditorScreen', () => {
    it('renders curriculum with sections', async () => {
      instructorApi.getCourseDetail.mockResolvedValueOnce({
        data: {
          data: {
            id: 1,
            title: 'Khóa học Spring Boot',
            status: 'DRAFT',
          },
        },
      });

      instructorApi.getSections.mockResolvedValueOnce({
        data: {
          data: [
            { id: 10, title: 'Khởi tạo dự án', orderIndex: 1 },
          ],
        },
      });

      const { getByText } = render(
        <CurriculumEditorScreen
          route={{ params: { courseId: 1 } }}
          navigation={mockNavigation}
        />
      );

      await waitFor(() => {
        expect(getByText('Khóa học Spring Boot')).toBeTruthy();
        expect(getByText('Chương 1: Khởi tạo dự án')).toBeTruthy();
        expect(getByText('🚀 Gửi phê duyệt khóa học')).toBeTruthy();
      });
    });
  });
});
