import React from 'react';
import { Portal, Snackbar } from 'react-native-paper';
import { useNetworkNoticeStore } from '../store/networkNoticeStore';

export default function NetworkSnackbar() {
  const { visible, dismiss } = useNetworkNoticeStore();
  return <Portal><Snackbar visible={visible} onDismiss={dismiss} duration={5000}
    action={{ label: 'Đóng', onPress: dismiss }}>
    Không kết nối được máy chủ. Kiểm tra mạng và thử lại.
  </Snackbar></Portal>;
}
