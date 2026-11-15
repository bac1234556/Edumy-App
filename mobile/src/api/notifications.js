import { api } from './client';
import { useNotificationsStore } from '../store/notificationsStore';

export async function fetchNotifications({ page = 0, size = 20 } = {}) {
  const { data } = await api.get('/me/notifications', { params: { page, size } });
  return data.data;
}

export async function fetchUnreadCount() {
  const { data } = await api.get('/me/notifications/unread-count');
  return data.data?.unreadCount ?? 0;
}

export async function refreshUnreadCount() {
  const count = await fetchUnreadCount();
  useNotificationsStore.getState().setUnreadCount(count);
  return count;
}

export async function markNotificationAsRead(id) {
  const { data } = await api.patch(`/me/notifications/${id}/read`);
  return data.data;
}

export async function markAllNotificationsAsRead() {
  const { data } = await api.patch('/me/notifications/read-all');
  return data.data;
}
