import React from 'react';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import { fetchNotifications, fetchUnreadCount, markNotificationAsRead, markAllNotificationsAsRead } from '../api/notifications';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { useNotificationsStore } from '../store/notificationsStore';

jest.mock('expo-router', () => ({
  useFocusEffect: (callback) => require('react').useEffect(callback, [callback]),
}));

jest.mock('../api/notifications', () => ({
  fetchNotifications: jest.fn(),
  fetchUnreadCount: jest.fn(),
  refreshUnreadCount: jest.fn(),
  markNotificationAsRead: jest.fn(),
  markAllNotificationsAsRead: jest.fn(),
}));

const clients = [];
function renderWithProviders(ui) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  clients.push(client);
  return render(
    <QueryClientProvider client={client}>
      <PaperProvider theme={{ ...MD3LightTheme, animation: { scale: 0 } }}>
        {ui}
      </PaperProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  jest.useFakeTimers();
  fetchUnreadCount.mockResolvedValue(0);
  require('../api/notifications').refreshUnreadCount.mockResolvedValue(0);
  useNotificationsStore.getState().setUnreadCount(0);
});

afterEach(() => {
  cleanup();
  clients.splice(0).forEach((c) => c.clear());
  act(() => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
});

describe('NotificationsScreen', () => {
  test('renders loading indicator initially', () => {
    fetchNotifications.mockReturnValue(new Promise(() => {}));
    const view = renderWithProviders(<NotificationsScreen onBack={jest.fn()} />);
    expect(view.getByLabelText('Đang tải thông báo')).toBeTruthy();
  });

  test('renders empty state when there are no notifications', async () => {
    fetchNotifications.mockResolvedValue({ content: [], page: 0, last: true, totalElements: 0 });
    const view = renderWithProviders(<NotificationsScreen onBack={jest.fn()} />);
    expect(await view.findByText('Bạn chưa có thông báo nào.')).toBeTruthy();
  });

  test('renders error state and refetches on retry click', async () => {
    fetchNotifications.mockRejectedValueOnce(new Error('Network error'));
    const view = renderWithProviders(<NotificationsScreen onBack={jest.fn()} />);
    expect(await view.findByRole('alert')).toBeTruthy();

    fetchNotifications.mockResolvedValueOnce({
      content: [
        {
          id: 1,
          type: 'COURSE_APPROVED',
          title: 'Khóa học đã duyệt',
          body: 'Chúc mừng bạn',
          isRead: true,
        },
      ],
      page: 0,
      last: true,
      totalElements: 1,
    });
    fireEvent.press(view.getByText('Thử lại'));
    expect(await view.findByText('Khóa học đã duyệt')).toBeTruthy();
  });

  test('renders notification list with unread chip and allows marking as read', async () => {
    fetchNotifications.mockResolvedValue({
      content: [
        {
          id: 10,
          type: 'COURSE_REJECTED',
          title: 'Khóa học cần chỉnh sửa',
          body: 'Lý do: Thiếu video bài 2',
          isRead: false,
        },
      ],
      page: 0,
      last: true,
      totalElements: 1,
    });
    markNotificationAsRead.mockResolvedValue({ id: 10, isRead: true });

    const view = renderWithProviders(<NotificationsScreen onBack={jest.fn()} />);
    expect(await view.findByText('Khóa học cần chỉnh sửa')).toBeTruthy();
    expect(view.getByText('Lý do: Thiếu video bài 2')).toBeTruthy();
    expect(view.getByText('Mới')).toBeTruthy();

    fireEvent.press(view.getByText('Khóa học cần chỉnh sửa'));
    await waitFor(() => {
      expect(markNotificationAsRead).toHaveBeenCalledWith(10);
    });
  });

  test('calls onBack when back button pressed', async () => {
    fetchNotifications.mockResolvedValue({ content: [], page: 0, last: true, totalElements: 0 });
    const onBack = jest.fn();
    const view = renderWithProviders(<NotificationsScreen onBack={onBack} />);
    fireEvent.press(await view.findByText('← Quay lại'));
    expect(onBack).toHaveBeenCalled();
  });
});
