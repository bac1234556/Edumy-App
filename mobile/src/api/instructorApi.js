import axios from 'axios';

const API_BASE = 'http://10.0.2.2:8080/api/v1/instructor';

export const instructorApi = {
  // Courses
  getMyCourses: () => axios.get(`${API_BASE}/courses`),
  getCourseDetail: (id) => axios.get(`${API_BASE}/courses/${id}`),
  submitForReview: (id) => axios.post(`${API_BASE}/courses/${id}/submit-review`),

  // Sections
  getSections: (courseId) => axios.get(`${API_BASE}/courses/${courseId}/sections`),
  createSection: (courseId, title) => axios.post(`${API_BASE}/courses/${courseId}/sections`, { title }),
  deleteSection: (sectionId) => axios.delete(`${API_BASE}/sections/${sectionId}`),

  // Lessons
  getLessons: (sectionId) => axios.get(`${API_BASE}/sections/${sectionId}/lessons`),
  createLesson: (sectionId, payload) => axios.post(`${API_BASE}/sections/${sectionId}/lessons`, payload),
  deleteLesson: (lessonId) => axios.delete(`${API_BASE}/lessons/${lessonId}`),
};