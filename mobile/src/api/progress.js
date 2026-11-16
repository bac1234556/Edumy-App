import { api } from './client';

// W9-D2: nối API tracking tiến độ của W9-D1 (#73).
export const resumeKey = (courseId) => ['learning', 'resume', courseId];

export async function fetchResume(courseId) {
  const { data } = await api.get(`/learn/courses/${courseId}/resume`);
  return data.data;
}

export async function saveLessonProgress(lessonId, { positionSec, completed = false }) {
  const { data } = await api.put(`/learn/lessons/${lessonId}/progress`, { positionSec, completed });
  return data.data;
}
