import { api } from './client';

export const getWishlist = async () => {
  const { data } = await api.get('/me/wishlist');
  return data.data || [];
};

export const getWishlistIds = async () => {
  const { data } = await api.get('/me/wishlist/ids');
  return data.data || [];
};

export const addToWishlist = async (courseId) => {
  const { data } = await api.post(`/me/wishlist/${courseId}`);
  return data.data;
};

export const removeFromWishlist = async (courseId) => {
  const { data } = await api.delete(`/me/wishlist/${courseId}`);
  return data.data;
};
