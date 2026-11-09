import { api } from './client';

export async function fetchPendingCourses({ page = 0, size = 50 } = {}) {
  const { data } = await api.get('/v1/admin/courses/pending', { params: { page, size } });
  return data.data;
}

export async function fetchAdminCourseDetail(courseId) {
  const { data } = await api.get(`/v1/admin/courses/${courseId}`);
  return data.data;
}

export async function approveCourse(courseId) {
  const { data } = await api.patch(`/v1/admin/courses/${courseId}/approve`);
  return data.data;
}

export async function rejectCourse(courseId, rejectionReason) {
  const { data } = await api.patch(`/v1/admin/courses/${courseId}/reject`, { rejectionReason });
  return data.data;
}
