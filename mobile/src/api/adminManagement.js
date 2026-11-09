import { api } from './client';

export async function fetchAdminUsers(params) {
  const { data } = await api.get('/admin/users', { params });
  return data.data;
}

export async function updateAdminUserStatus(userId, status) {
  const { data } = await api.patch(`/admin/users/${userId}/status`, { status });
  return data.data;
}

export async function fetchAdminCategories() {
  const { data } = await api.get('/admin/categories');
  return data.data;
}

export async function createCategory(category) {
  const { data } = await api.post('/admin/categories', category);
  return data.data;
}

export async function updateCategory(categoryId, category) {
  const { data } = await api.put(`/admin/categories/${categoryId}`, category);
  return data.data;
}
