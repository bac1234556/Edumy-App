import { api } from './client';

export async function fetchNotifications({ page = 0, size = 20 } = {}) {
  const { data } = await api.get('/notifications', { params: { page, size } });
  return data.data;
}

export async function fetchUnreadCount() {
  const { data } = await api.get('/notifications/unread-count');
  return data.data?.unreadCount ?? 0;
}

export async function markNotificationAsRead(id) {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data.data;
}

export async function markAllNotificationsAsRead() {
  const { data } = await api.patch('/notifications/read-all');
  return data.data;
}
