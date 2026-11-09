import { api } from './client';

// W8-D2: nối API thật của W8-D1 (#45).
export const MY_COURSES_KEY = ['learning', 'my-courses'];

export async function fetchCheckoutCourse(courseId) {
  const { data } = await api.get(`/courses/${courseId}`);
  return data.data;
}

export async function checkoutCourse({ courseId, paymentMethod = 'MOCK' }) {
  const { data } = await api.post('/orders/checkout', { courseId: Number(courseId), paymentMethod });
  return data.data;
}

export async function fetchMyCourses() {
  const { data } = await api.get('/learning/my-courses');
  return data.data;
}
