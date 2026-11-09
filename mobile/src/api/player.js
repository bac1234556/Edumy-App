import { api } from './client';

// Giáo trình lấy từ API public của Course Detail; link video lấy qua API có kiểm tra quyền.
export async function fetchCourseCurriculum(courseId) {
  const { data } = await api.get(`/courses/${courseId}`);
  return data.data;
}

export async function fetchLesson(courseId, lessonId) {
  const { data } = await api.get(`/learning/courses/${courseId}/lessons/${lessonId}`);
  return data.data;
}
