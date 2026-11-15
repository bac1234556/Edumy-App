import { api } from './client';

export async function fetchAdminStats() {
  const { data } = await api.get('/admin/stats');
  return data.data;
}
