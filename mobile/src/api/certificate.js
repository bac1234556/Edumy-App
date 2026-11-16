import * as FileSystem from 'expo-file-system';
import { api } from './client';
import { useAuthStore } from '../store/authStore';

// W9-D3: chứng chỉ hoàn thành khóa học (API của PR #75).
export const certificateKey = (courseId) => ['learning', 'certificate', courseId];

export async function fetchCourseCertificate(courseId) {
  const { data } = await api.get(`/learn/courses/${courseId}/certificate`);
  return data.data;
}

// API công khai, không cần đăng nhập.
export async function verifyCertificate(code) {
  const { data } = await api.get(`/certificates/${encodeURIComponent(code)}/verify`);
  return data.data;
}

/** Tải PDF về bộ nhớ ứng dụng bằng expo-file-system, trả về đường dẫn file. */
export async function downloadCertificatePdf(code) {
  // downloadAsync không đi qua interceptor của axios: gọi một API có xác thực trước để token (đã hết hạn) được làm mới.
  try { await api.get('/users/me'); } catch { /* token xấu sẽ báo ở bước tải */ }
  const token = useAuthStore.getState().session?.accessToken;
  const target = `${FileSystem.documentDirectory}chung-chi-${code}.pdf`;
  const result = await FileSystem.downloadAsync(
    `${api.defaults.baseURL}/certificates/${encodeURIComponent(code)}/pdf`,
    target,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  );
  if (result.status !== 200) {
    await FileSystem.deleteAsync(target, { idempotent: true });
    throw new Error(result.status === 401
      ? 'Phiên đăng nhập đã hết hạn. Vui lòng thử lại.'
      : 'Không tải được chứng chỉ. Vui lòng thử lại.');
  }
  return result.uri;
}

/**
 * Android: cho học viên chọn thư mục (ví dụ Downloads) rồi chép file vào đó.
 * Trả về false nếu học viên không cấp quyền hoặc thiết bị không hỗ trợ; file vẫn nằm trong bộ nhớ ứng dụng.
 */
export async function saveToDeviceFolder(uri, code) {
  const { StorageAccessFramework } = FileSystem;
  if (!StorageAccessFramework) return false;
  try {
    const permission = await StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permission.granted) return false;
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const target = await StorageAccessFramework.createFileAsync(permission.directoryUri, `chung-chi-${code}`, 'application/pdf');
    await FileSystem.writeAsStringAsync(target, base64, { encoding: FileSystem.EncodingType.Base64 });
    return true;
  } catch {
    return false;
  }
}
