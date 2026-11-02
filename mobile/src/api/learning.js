import { api } from './client';
import { COURSES_MOCK } from '../mock/coursesMock';
import { ENROLLMENTS_MOCK } from '../mock/enrollmentsMock';

// W7-D3: UI chạy với mock. Đặt EXPO_PUBLIC_LEARNING_MOCK=false để gọi API stub/thật.
export const USE_LEARNING_MOCK = process.env.EXPO_PUBLIC_LEARNING_MOCK !== 'false';
const MOCK_DELAY_MS = 400;

const delay = (value) => new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));

export async function fetchCheckoutCourse(courseId) {
  if (USE_LEARNING_MOCK) return delay(COURSES_MOCK.find((c) => c.id === Number(courseId)) || null);
  const { data } = await api.get(`/courses/${courseId}`);
  return data.data;
}

export async function createOrder({ courseId, paymentMethod = 'MOCK' }) {
  if (USE_LEARNING_MOCK) {
    const course = COURSES_MOCK.find((c) => c.id === Number(courseId));
    return delay({
      txnRef: `EDU${Date.now()}`,
      courseId: Number(courseId),
      courseTitle: course?.title,
      amount: course?.price ?? 0,
      status: 'PENDING',
      paymentMethod,
      createdAt: new Date().toISOString(),
    });
  }
  const { data } = await api.post('/orders', { courseId: Number(courseId), paymentMethod });
  return data.data;
}

export async function fetchMyEnrollments() {
  if (USE_LEARNING_MOCK) return delay(ENROLLMENTS_MOCK);
  const { data } = await api.get('/me/enrollments');
  return data.data;
}
