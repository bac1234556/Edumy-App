import { api } from './client';

export async function fetchLessonQuestions(lessonId, page = 0, size = 20) {
  const { data } = await api.get(`/lessons/${lessonId}/questions`, { params: { page, size } });
  return data.data;
}

export async function createLessonQuestion(lessonId, content) {
  const { data } = await api.post(`/lessons/${lessonId}/questions`, { content });
  return data.data;
}

export async function createQuestionAnswer(questionId, content) {
  const { data } = await api.post(`/questions/${questionId}/answers`, { content });
  return data.data;
}

export async function acceptQuestionAnswer(answerId) {
  const { data } = await api.patch(`/answers/${answerId}/accept`);
  return data.data;
}
