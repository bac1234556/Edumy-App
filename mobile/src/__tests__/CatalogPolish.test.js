import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CourseCard } from '../components/common/CourseCard';
import { CourseCardSkeleton } from '../components/common/CourseCardSkeleton';
import { SearchScreen } from '../screens/SearchScreen';
import { WishlistScreen } from '../screens/WishlistScreen';
import * as wishlistApi from '../api/wishlist';
import { api } from '../api/client';

jest.mock('../api/client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../api/wishlist', () => ({
  getWishlist: jest.fn(),
  getWishlistIds: jest.fn(),
  addToWishlist: jest.fn(),
  removeFromWishlist: jest.fn(),
}));

describe('W10-B1 Polish UI Catalog & Fallback Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('CourseCard displays fallback image when thumbnail URL is null or triggers error', () => {
    const courseWithoutThumb = {
      id: 99,
      title: 'Khóa học không có ảnh thumbnail tiêu chuẩn với tiêu đề rất dài để kiểm tra cắt dòng',
      price: 199000,
      level: 'BEGINNER',
      categoryName: 'Công nghệ',
      thumbnailUrl: null,
    };

    const { getByText, UNSAFE_getByType } = render(
      <CourseCard course={courseWithoutThumb} layout="vertical" />
    );

    expect(getByText(courseWithoutThumb.title)).toBeTruthy();
    const image = UNSAFE_getByType(require('react-native').Image);
    expect(image.props.source.uri).toContain('images.unsplash.com');

    // Simulate image loading error
    fireEvent(image, 'error');
    expect(image.props.source.uri).toContain('images.unsplash.com');
  });

  test('CourseCard applies 2-line limit and tail ellipsis for long titles', () => {
    const course = {
      id: 100,
      title: 'Đây là một tiêu đề khóa học cực kỳ dài vượt quá hai dòng hiển thị trên thiết bị màn hình nhỏ 5 inch để đảm bảo không bị tràn giao diện',
      price: 0,
      level: 'ALL_LEVELS',
      categoryName: 'Thiết kế',
      thumbnailUrl: 'https://example.com/test.jpg',
    };

    const { getByText } = render(<CourseCard course={course} layout="horizontal" />);
    const titleEl = getByText(course.title);
    expect(titleEl.props.numberOfLines).toBe(2);
    expect(titleEl.props.ellipsizeMode).toBe('tail');
  });

  test('CourseCardSkeleton renders properly for horizontal and vertical layouts', () => {
    const { getByTestId: getHoriz } = render(<CourseCardSkeleton layout="horizontal" />);
    expect(getHoriz('course-card-skeleton')).toBeTruthy();

    const { getByTestId: getVert } = render(<CourseCardSkeleton layout="vertical" />);
    expect(getVert('course-card-skeleton')).toBeTruthy();
  });

  test('WishlistScreen displays ErrorView when API throws error', async () => {
    wishlistApi.getWishlist.mockRejectedValueOnce(new Error('Mạng bị gián đoạn'));

    const { findByText } = render(<WishlistScreen navigation={{ navigate: jest.fn() }} />);

    expect(await findByText('Lỗi tải dữ liệu')).toBeTruthy();
    expect(await findByText('Mạng bị gián đoạn')).toBeTruthy();
    expect(await findByText('Thử lại')).toBeTruthy();
  });

  test('WishlistScreen displays empty state when wishlist is empty', async () => {
    wishlistApi.getWishlist.mockResolvedValueOnce([]);

    const { findByText } = render(<WishlistScreen navigation={{ navigate: jest.fn() }} />);

    expect(await findByText('Danh sách yêu thích trống')).toBeTruthy();
    expect(await findByText('Khám phá ngay')).toBeTruthy();
  });
});
