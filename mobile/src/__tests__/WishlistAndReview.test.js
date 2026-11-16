jest.setTimeout(20000);
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { WishlistScreen } from '../screens/WishlistScreen';
import { ReviewFormModal } from '../components/common/ReviewFormModal';
import * as wishlistApi from '../api/wishlist';
import * as reviewApi from '../api/reviews';

jest.mock('../api/wishlist');
jest.mock('../api/reviews');
jest.mock('../api/client', () => ({
  api: {
    get: jest.fn().mockResolvedValue({ data: { data: [] } }),
    post: jest.fn().mockResolvedValue({ data: { data: {} } }),
    put: jest.fn().mockResolvedValue({ data: { data: {} } }),
    delete: jest.fn().mockResolvedValue({ data: { data: {} } }),
  },
}));

describe('WishlistScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders empty state when user has no wishlist courses', async () => {
    wishlistApi.getWishlist.mockResolvedValue([]);
    const { findByText } = render(<WishlistScreen />);

    expect(await findByText('Danh sách yêu thích trống')).toBeTruthy();
    expect(await findByText('Khám phá ngay')).toBeTruthy();
  });

  test('renders list of wishlisted courses and handles removal', async () => {
    const mockWishlist = [
      {
        id: 101,
        title: 'Lập trình React Native thực chiến',
        subtitle: 'Xây dựng ứng dụng hoàn chỉnh',
        price: 299000,
        averageRating: 4.8,
        totalReviews: 120,
        thumbnailUrl: 'https://example.com/thumb.jpg',
      },
    ];
    wishlistApi.getWishlist.mockResolvedValue(mockWishlist);
    wishlistApi.removeFromWishlist.mockResolvedValue({ courseId: 101, wishlisted: false });

    const { findByText, getByText } = render(<WishlistScreen />);

    expect(await findByText('Lập trình React Native thực chiến')).toBeTruthy();
    expect(getByText('1 khóa học đã lưu')).toBeTruthy();

    // Toggle wishlist heart to remove
    const heartBtn = getByText('♥');
    fireEvent.press(heartBtn);

    await waitFor(() => {
      expect(wishlistApi.removeFromWishlist).toHaveBeenCalledWith(101);
    });
  });
});

describe('ReviewFormModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders form and submits new review', async () => {
    reviewApi.createReview.mockResolvedValue({
      id: 1,
      rating: 5,
      comment: 'Khóa học tuyệt vời!',
    });

    const onSubmitSuccess = jest.fn();
    const onClose = jest.fn();

    const { getByText, getByPlaceholderText } = render(
      <ReviewFormModal
        visible={true}
        courseId={1}
        onClose={onClose}
        onSubmitSuccess={onSubmitSuccess}
      />
    );

    expect(getByText('Đánh giá khóa học')).toBeTruthy();

    const input = getByPlaceholderText('Chia sẻ cảm nhận của bạn về khóa học này...');
    fireEvent.changeText(input, 'Khóa học tuyệt vời!');

    const submitBtn = getByText('Gửi đánh giá');
    fireEvent.press(submitBtn);

    await waitFor(() => {
      expect(reviewApi.createReview).toHaveBeenCalledWith(1, {
        rating: 5,
        comment: 'Khóa học tuyệt vời!',
      });
      expect(onSubmitSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
