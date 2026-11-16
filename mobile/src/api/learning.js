import * as Linking from 'expo-linking';
import { api } from './client';

// W8-D2: nối API thật của W8-D1 (#45). W10-D1 (#95): thêm cổng VNPay sandbox.
export const MY_COURSES_KEY = ['learning', 'my-courses'];
export const PROVIDER_KEY = ['payments', 'provider'];

/** Deep link để trang thanh toán VNPay mở lại app (edumy://payment-result, hoặc exp://... khi chạy Expo Go). */
export const paymentReturnUri = () => Linking.createURL('payment-result');

export async function fetchCheckoutCourse(courseId) {
  const { data } = await api.get(`/courses/${courseId}`);
  return data.data;
}

// Không gửi paymentMethod: server dùng cổng đang bật (payment.provider = mock | vnpay).
export async function checkoutCourse({ courseId }) {
  const { data } = await api.post('/orders/checkout', { courseId: Number(courseId), returnUri: paymentReturnUri() });
  return data.data;
}

export async function fetchPaymentProvider() {
  const { data } = await api.get('/payments/provider');
  return data.data;
}

export async function fetchOrder(txnRef) {
  const { data } = await api.get(`/orders/${encodeURIComponent(txnRef)}`);
  return data.data;
}

export async function fetchMyCourses() {
  const { data } = await api.get('/learning/my-courses');
  return data.data;
}
