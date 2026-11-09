jest.setTimeout(20000);
import React from 'react';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import { checkoutCourse, fetchCheckoutCourse, fetchMyCourses } from '../api/learning';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { MyLearningScreen } from '../screens/MyLearningScreen';
import { PaymentResultScreen } from '../screens/PaymentResultScreen';
import { COURSES_MOCK } from '../mock/coursesMock';
import { ENROLLMENTS_MOCK } from '../mock/enrollmentsMock';

jest.mock('../api/learning', () => ({
  MY_COURSES_KEY: ['learning', 'my-courses'],
  fetchCheckoutCourse: jest.fn(), checkoutCourse: jest.fn(), fetchMyCourses: jest.fn(),
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
const PAID_RESULT = {
  orderId: 5, txnRef: 'EDU123', courseId: 1, courseTitle: COURSES_MOCK[0].title,
  amount: 499000, status: 'PAID', paymentMethod: 'MOCK', enrollmentId: 9,
};

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
  test('shows loading then course summary, price and mock payment method', async () => {
    fetchCheckoutCourse.mockResolvedValue(COURSES_MOCK[0]);
    const view = renderWithProviders(<CheckoutScreen courseId={1} />);
    expect(view.getByLabelText('Đang tải thông tin khóa học')).toBeTruthy();
    expect(await view.findByText(COURSES_MOCK[0].title)).toBeTruthy();
    expect(view.getByText('Thanh toán mô phỏng (Mock)')).toBeTruthy();
    expect(view.getByTestId('checkout-pay')).toBeTruthy();
  });

  test('pay calls the mock checkout API and hands the result to onSuccess', async () => {
    fetchCheckoutCourse.mockResolvedValue(COURSES_MOCK[0]);
    checkoutCourse.mockResolvedValue(PAID_RESULT);
    const onSuccess = jest.fn();
    const view = renderWithProviders(<CheckoutScreen courseId={1} onSuccess={onSuccess} />);
    fireEvent.press(await view.findByTestId('checkout-pay'));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(PAID_RESULT));
    expect(checkoutCourse).toHaveBeenCalledWith({ courseId: 1, paymentMethod: 'MOCK' });
  });

  test('free course offers free enrollment without payment methods', async () => {
    fetchCheckoutCourse.mockResolvedValue(COURSES_MOCK.find((c) => c.price === 0));
    const view = renderWithProviders(<CheckoutScreen courseId={3} />);
    expect(await view.findByText('Đăng ký miễn phí')).toBeTruthy();
    expect(view.queryByText('Phương thức thanh toán')).toBeNull();
  });

  test('already owned course (409) shows the message and a learn button', async () => {
    fetchCheckoutCourse.mockResolvedValue(COURSES_MOCK[0]);
    checkoutCourse.mockRejectedValue({ response: { status: 409, data: { message: 'Bạn đã sở hữu khóa học này' } } });
    const onLearn = jest.fn();
    const view = renderWithProviders(<CheckoutScreen courseId={1} onLearn={onLearn} />);
    fireEvent.press(await view.findByTestId('checkout-pay'));
    expect(await view.findByText('Bạn đã sở hữu khóa học này')).toBeTruthy();
    fireEvent.press(view.getByTestId('checkout-learn'));
    expect(onLearn).toHaveBeenCalledWith(1);
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
});

describe('PaymentResultScreen', () => {
  test('paid order shows success, transaction and "Vào học ngay"', () => {
    const onLearn = jest.fn();
    const onMyLearning = jest.fn();
    const view = renderWithProviders(<PaymentResultScreen result={PAID_RESULT} onLearn={onLearn} onMyLearning={onMyLearning} />);
    expect(view.getByTestId('result-title').props.children).toBe('Đặt hàng thành công');
    expect(view.getByTestId('result-txn').props.children.join('')).toContain('EDU123');
    fireEvent.press(view.getByTestId('result-learn'));
    expect(onLearn).toHaveBeenCalledWith(1);
    fireEvent.press(view.getByText('Khóa học của tôi'));
    expect(onMyLearning).toHaveBeenCalled();
  });

  test('free enrollment shows a free success message without transaction', () => {
    const view = renderWithProviders(<PaymentResultScreen result={{ courseId: 3, courseTitle: 'Figma', status: 'FREE', amount: 0 }} />);
    expect(view.getByTestId('result-title').props.children).toBe('Đăng ký khóa học thành công');
    expect(view.queryByTestId('result-txn')).toBeNull();
    expect(view.getByText('Số tiền: Miễn phí')).toBeTruthy();
  });

  test('empty state without result', () => {
    const onHome = jest.fn();
    const view = renderWithProviders(<PaymentResultScreen result={null} onHome={onHome} />);
    expect(view.getByTestId('result-empty')).toBeTruthy();
    fireEvent.press(view.getByText('Về trang chủ'));
    expect(onHome).toHaveBeenCalled();
  });
});

describe('MyLearningScreen', () => {
  test('lists purchased courses with progress and opens the player on tap', async () => {
    fetchMyCourses.mockResolvedValue(ENROLLMENTS_MOCK);
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
    fetchMyCourses.mockResolvedValue([]);
    const onExplore = jest.fn();
    const view = renderWithProviders(<MyLearningScreen onExplore={onExplore} />);
    expect(await view.findByText('Bạn chưa mua khóa học nào')).toBeTruthy();
    fireEvent.press(view.getByText('Khám phá khóa học'));
    expect(onExplore).toHaveBeenCalled();
  });

  test('error state retries the request', async () => {
    fetchMyCourses.mockRejectedValueOnce(networkError).mockResolvedValue(ENROLLMENTS_MOCK);
    const view = renderWithProviders(<MyLearningScreen />);
    expect(await view.findByText('Không kết nối được máy chủ. Kiểm tra mạng và thử lại.')).toBeTruthy();
    fireEvent.press(view.getByText('Thử lại'));
    await waitFor(() => expect(view.getByText(ENROLLMENTS_MOCK[1].courseTitle)).toBeTruthy());
  });
});
