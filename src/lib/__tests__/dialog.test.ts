// src/lib/__tests__/dialog.test.ts
import { Alert, Platform } from 'react-native';
import { confirm, notify } from '../dialog';

describe('dialog.ts', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
    jest.restoreAllMocks();
  });

  it('calls window.confirm on web and returns boolean result', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
    const confirmMock = jest.fn().mockReturnValue(true);
    (globalThis as unknown as { window: { confirm: jest.Mock } }).window = {
      confirm: confirmMock,
    };

    const result = await confirm({
      title: 'Đăng xuất',
      message: 'Bạn có chắc chắn?',
    });

    expect(confirmMock).toHaveBeenCalledWith('Đăng xuất\n\nBạn có chắc chắn?');
    expect(result).toBe(true);
  });

  it('calls window.alert on web for notify', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
    const alertMock = jest.fn();
    (globalThis as unknown as { window: { alert: jest.Mock } }).window = {
      alert: alertMock,
    };

    await notify('Thông báo', 'Thành công');
    expect(alertMock).toHaveBeenCalledWith('Thông báo\n\nThành công');
  });

  it('calls Alert.alert on native for confirm and resolves button callback', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      buttons?.[1]?.onPress?.();
    });

    const result = await confirm({
      title: 'Xóa',
      message: 'Xác nhận xóa?',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      destructive: true,
    });

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });
});
