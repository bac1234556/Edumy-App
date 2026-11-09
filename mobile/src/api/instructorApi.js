import { api } from './client';

export const instructorApi = {
  // Courses
  getMyCourses: () => api.get('/instructor/courses'),
  getCourseDetail: (id) => api.get(`/instructor/courses/${id}`),
  submitForReview: (id) => api.post(`/instructor/courses/${id}/submit-review`),

  // Sections
  getSections: (courseId) => api.get(`/instructor/courses/${courseId}/sections`),
  createSection: (courseId, title) => api.post(`/instructor/courses/${courseId}/sections`, { title }),
  deleteSection: (sectionId) => api.delete(`/instructor/sections/${sectionId}`),

  // Lessons
  getLessons: (sectionId) => api.get(`/instructor/sections/${sectionId}/lessons`),
  createLesson: (sectionId, payload) => api.post(`/instructor/sections/${sectionId}/lessons`, payload),
  deleteLesson: (lessonId) => api.delete(`/instructor/lessons/${lessonId}`),
};
