jest.setTimeout(20000);
import React from 'react';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import { createOrder, fetchCheckoutCourse, fetchMyEnrollments } from '../api/learning';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { MyLearningScreen } from '../screens/MyLearningScreen';
import { COURSES_MOCK } from '../mock/coursesMock';
import { ENROLLMENTS_MOCK } from '../mock/enrollmentsMock';

jest.mock('../api/learning', () => ({
  fetchCheckoutCourse: jest.fn(), createOrder: jest.fn(), fetchMyEnrollments: jest.fn(),
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn(),
}));

const clients = [];
function renderWithProviders(ui) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  clients.push(client);
  return render(<QueryClientProvider client={client}><PaperProvider theme={{ ...MD3LightTheme, animation: { scale: 0 } }}>{ui}</PaperProvider></QueryClientProvider>);
}
const networkError = Object.assign(new Error('Network Error'), { response: undefined });

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((c) => c.clear());
  act(() => { jest.runOnlyPendingTimers(); });
  jest.useRealTimers();
});

describe('CheckoutScreen', () => {
  test('shows loading then course summary, price and pay button', async () => {
    fetchCheckoutCourse.mockResolvedValue(COURSES_MOCK[0]);
    const view = renderWithProviders(<CheckoutScreen courseId={1} />);
    expect(view.getByLabelText('Đang tải thông tin khóa học')).toBeTruthy();
    expect(await view.findByText(COURSES_MOCK[0].title)).toBeTruthy();
    expect(view.getByText('Thanh toán mô phỏng (Mock)')).toBeTruthy();
    expect(view.getByTestId('checkout-pay')).toBeTruthy();
  });

  test('pay creates a MOCK order and shows the transaction reference', async () => {
    fetchCheckoutCourse.mockResolvedValue(COURSES_MOCK[0]);
    createOrder.mockResolvedValue({ txnRef: 'EDU123', status: 'PENDING', courseId: 1 });
    const onDone = jest.fn();
    const view = renderWithProviders(<CheckoutScreen courseId={1} onDone={onDone} />);
    fireEvent.press(await view.findByTestId('checkout-pay'));
    expect((await view.findByTestId('checkout-txn')).props.children.join('')).toContain('EDU123');
    expect(createOrder).toHaveBeenCalledWith({ courseId: 1, paymentMethod: 'MOCK' });
    fireEvent.press(view.getByText('Đến Khóa học của tôi'));
    expect(onDone).toHaveBeenCalled();
  });

  test('free course offers free enrollment without payment methods', async () => {
    fetchCheckoutCourse.mockResolvedValue(COURSES_MOCK.find((c) => c.price === 0));
    const view = renderWithProviders(<CheckoutScreen courseId={3} />);
    expect(await view.findByText('Đăng ký miễn phí')).toBeTruthy();
    expect(view.queryByText('Phương thức thanh toán')).toBeNull();
  });

  test('empty state when the course does not exist', async () => {
    fetchCheckoutCourse.mockResolvedValue(null);
    const view = renderWithProviders(<CheckoutScreen courseId={999} />);
    expect(await view.findByTestId('checkout-empty')).toBeTruthy();
  });

  test('error state with retry when loading fails', async () => {
    fetchCheckoutCourse.mockRejectedValueOnce(networkError).mockResolvedValue(COURSES_MOCK[0]);
    const view = renderWithProviders(<CheckoutScreen courseId={1} />);
    fireEvent.press(await view.findByText('Thử lại'));
    expect(await view.findByText(COURSES_MOCK[0].title)).toBeTruthy();
  });

  test('order failure shows an inline error', async () => {
    fetchCheckoutCourse.mockResolvedValue(COURSES_MOCK[0]);
    createOrder.mockRejectedValue({ response: { data: { message: 'Bạn đã sở hữu khóa học này' } } });
    const view = renderWithProviders(<CheckoutScreen courseId={1} />);
    fireEvent.press(await view.findByTestId('checkout-pay'));
    expect(await view.findByText('Bạn đã sở hữu khóa học này')).toBeTruthy();
  });
});

describe('MyLearningScreen', () => {
  test('lists purchased courses with progress', async () => {
    fetchMyEnrollments.mockResolvedValue(ENROLLMENTS_MOCK);
    const onOpenCourse = jest.fn();
    const view = renderWithProviders(<MyLearningScreen onOpenCourse={onOpenCourse} />);
    expect(view.getByLabelText('Đang tải khóa học của tôi')).toBeTruthy();
    expect(await view.findByText(ENROLLMENTS_MOCK[0].courseTitle)).toBeTruthy();
    expect(view.getByText('33% hoàn thành · 3/9 bài')).toBeTruthy();
    expect(view.getByText('Đã hoàn thành · 6/6 bài')).toBeTruthy();
    fireEvent.press(view.getByTestId('enrollment-1'));
    expect(onOpenCourse).toHaveBeenCalledWith(ENROLLMENTS_MOCK[0]);
  });

  test('empty state links to the catalog', async () => {
    fetchMyEnrollments.mockResolvedValue([]);
    const onExplore = jest.fn();
    const view = renderWithProviders(<MyLearningScreen onExplore={onExplore} />);
    expect(await view.findByText('Bạn chưa mua khóa học nào')).toBeTruthy();
    fireEvent.press(view.getByText('Khám phá khóa học'));
    expect(onExplore).toHaveBeenCalled();
  });

  test('error state retries the request', async () => {
    fetchMyEnrollments.mockRejectedValueOnce(networkError).mockResolvedValue(ENROLLMENTS_MOCK);
    const view = renderWithProviders(<MyLearningScreen />);
    expect(await view.findByText('Không kết nối được máy chủ. Kiểm tra mạng và thử lại.')).toBeTruthy();
    fireEvent.press(view.getByText('Thử lại'));
    await waitFor(() => expect(view.getByText(ENROLLMENTS_MOCK[1].courseTitle)).toBeTruthy());
  });
});
