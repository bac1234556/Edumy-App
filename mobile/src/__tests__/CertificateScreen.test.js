import React from 'react';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import * as Sharing from 'expo-sharing';
import {
  downloadCertificatePdf, fetchCourseCertificate, saveToDeviceFolder, verifyCertificate,
} from '../api/certificate';
import { CertificateScreen } from '../screens/CertificateScreen';

jest.mock('../api/certificate', () => ({
  certificateKey: (id) => ['learning', 'certificate', id],
  fetchCourseCertificate: jest.fn(),
  verifyCertificate: jest.fn(),
  downloadCertificatePdf: jest.fn(),
  saveToDeviceFolder: jest.fn(),
}));
jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn(),
}));

const CERT = {
  code: 'EDUMY-2026-K7M2QX4P', courseId: 7, courseTitle: 'Java cơ bản', studentName: 'Nguyễn Thị Thủy',
  instructorName: 'Trần Văn Chuyên', issuedAt: '2026-11-16T10:30:00', pdfPath: '/api/certificates/EDUMY-2026-K7M2QX4P/pdf',
};
const clients = [];

function renderScreen(props = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  clients.push(client);
  return render(<QueryClientProvider client={client}><PaperProvider theme={{ ...MD3LightTheme, animation: { scale: 0 } }}>
    <CertificateScreen courseId={7} {...props} />
  </PaperProvider></QueryClientProvider>);
}

beforeEach(() => {
  jest.useFakeTimers();
  fetchCourseCertificate.mockResolvedValue(CERT);
  downloadCertificatePdf.mockResolvedValue('file:///docs/chung-chi.pdf');
  saveToDeviceFolder.mockResolvedValue(false);
  Sharing.isAvailableAsync.mockResolvedValue(true);
  Sharing.shareAsync.mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((c) => c.clear());
  act(() => { jest.runOnlyPendingTimers(); });
  jest.useRealTimers();
});

test('shows loading and then the certificate details', async () => {
  const view = renderScreen();
  expect(view.getByLabelText('Đang tải chứng chỉ')).toBeTruthy();
  expect(await view.findByTestId('certificate-student')).toBeTruthy();
  expect(view.getByTestId('certificate-student').props.children).toBe('Nguyễn Thị Thủy');
  expect(view.getByTestId('certificate-course').props.children).toBe('Java cơ bản');
  expect(view.getByTestId('certificate-code').props.children).toBe('EDUMY-2026-K7M2QX4P');
  expect(view.getByText('Giảng viên: Trần Văn Chuyên')).toBeTruthy();
  expect(view.getByText('Ngày cấp: 16/11/2026')).toBeTruthy();
});

test('empty state when the course is not completed yet (404)', async () => {
  fetchCourseCertificate.mockRejectedValue({ response: { status: 404, data: { message: 'Bạn chưa hoàn thành khóa học nên chưa có chứng chỉ' } } });
  const onBack = jest.fn();
  const view = renderScreen({ onBack });
  expect(await view.findByTestId('certificate-empty')).toBeTruthy();
  expect(view.queryByTestId('certificate-download')).toBeNull();
  fireEvent.press(view.getByText('Quay lại', { exact: true }));
  expect(onBack).toHaveBeenCalled();
});

test('error state retries loading', async () => {
  fetchCourseCertificate.mockRejectedValueOnce(new Error('Network Error')).mockResolvedValue(CERT);
  const view = renderScreen();
  expect(await view.findByText('Không kết nối được máy chủ. Kiểm tra mạng và thử lại.')).toBeTruthy();
  fireEvent.press(view.getByText('Thử lại'));
  expect(await view.findByTestId('certificate-student')).toBeTruthy();
});

test('download saves the PDF and tells where it went', async () => {
  const view = renderScreen();
  fireEvent.press(await view.findByTestId('certificate-download'));
  expect((await view.findByTestId('certificate-notice')).props.children).toContain('bộ nhớ ứng dụng');
  expect(downloadCertificatePdf).toHaveBeenCalledWith('EDUMY-2026-K7M2QX4P');
  expect(saveToDeviceFolder).toHaveBeenCalledWith('file:///docs/chung-chi.pdf', 'EDUMY-2026-K7M2QX4P');
});

test('download into a chosen folder reports success', async () => {
  saveToDeviceFolder.mockResolvedValue(true);
  const view = renderScreen();
  fireEvent.press(await view.findByTestId('certificate-download'));
  expect((await view.findByTestId('certificate-notice')).props.children).toContain('thư mục bạn chọn');
});

test('download failure shows the error and keeps the buttons usable', async () => {
  downloadCertificatePdf.mockRejectedValue(new Error('Không tải được chứng chỉ. Vui lòng thử lại.'));
  const view = renderScreen();
  fireEvent.press(await view.findByTestId('certificate-download'));
  expect(await view.findByText('Không tải được chứng chỉ. Vui lòng thử lại.')).toBeTruthy();
  expect(view.getByTestId('certificate-share').props.accessibilityState?.disabled).toBeFalsy();
});

test('share downloads the PDF and opens the system share sheet', async () => {
  const view = renderScreen();
  fireEvent.press(await view.findByTestId('certificate-share'));
  await waitFor(() => expect(Sharing.shareAsync).toHaveBeenCalledWith(
    'file:///docs/chung-chi.pdf', expect.objectContaining({ mimeType: 'application/pdf' }),
  ));
});

test('share reports when the device cannot share files', async () => {
  Sharing.isAvailableAsync.mockResolvedValue(false);
  const view = renderScreen();
  fireEvent.press(await view.findByTestId('certificate-share'));
  expect(await view.findByText('Thiết bị không hỗ trợ chia sẻ file')).toBeTruthy();
  expect(Sharing.shareAsync).not.toHaveBeenCalled();
});

test('verify shows the public verification result', async () => {
  verifyCertificate.mockResolvedValue({ valid: true, code: CERT.code, studentName: 'Nguyễn Thị Thủy', courseTitle: 'Java cơ bản' });
  const view = renderScreen();
  fireEvent.press(await view.findByTestId('certificate-verify'));
  const result = await view.findByTestId('certificate-verified');
  expect(result.props.children.join('')).toContain('Chứng chỉ hợp lệ');
  expect(verifyCertificate).toHaveBeenCalledWith('EDUMY-2026-K7M2QX4P');
});

test('verify failure shows the server message', async () => {
  verifyCertificate.mockRejectedValue({ response: { status: 404, data: { message: 'Mã chứng chỉ không tồn tại' } } });
  const view = renderScreen();
  fireEvent.press(await view.findByTestId('certificate-verify'));
  expect(await view.findByText('Mã chứng chỉ không tồn tại')).toBeTruthy();
});
