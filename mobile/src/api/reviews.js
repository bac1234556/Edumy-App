import { api } from './client';

export const getCourseReviews = async (courseId, page = 0, size = 10) => {
  const { data } = await api.get(`/courses/${courseId}/reviews`, {
    params: { page, size }
  });
  return data.data;
};

export const createReview = async (courseId, { rating, comment }) => {
  const { data } = await api.post(`/courses/${courseId}/reviews`, { rating, comment });
  return data.data;
};

export const updateReview = async (courseId, { rating, comment }) => {
  const { data } = await api.put(`/courses/${courseId}/reviews`, { rating, comment });
  return data.data;
};

export const deleteReview = async (courseId) => {
  const { data } = await api.delete(`/courses/${courseId}/reviews`);
  return data.data;
};
