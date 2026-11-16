import React from 'react';
import { View } from 'react-native';
import { ActivityIndicator, Button, Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { errorMessage } from '../api/client';
import { fetchOrder } from '../api/learning';

function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount) || 0);
}

function Page({ children }) {
  return <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 }}>{children}</SafeAreaView>;
}

/**
 * Kết quả thanh toán. Nhận `result` đầy đủ (từ Checkout) hoặc chỉ `txnRef` (deep link từ trang VNPay quay về):
 * khi chỉ có txnRef hoặc đơn còn PENDING thì hỏi server, vì tham số trên deep link không đáng tin.
 */
export function PaymentResultScreen({ result, txnRef, onLearn, onMyLearning, onHome, onRetry }) {
  const ref = txnRef || result?.txnRef;
  const needsFetch = !!ref && (!result?.courseId || result.status === 'PENDING');
  const order = useQuery({
    queryKey: ['order', ref], queryFn: () => fetchOrder(ref), enabled: needsFetch, retry: false,
  });
  const data = order.data || (result?.courseId ? result : null);

  if (needsFetch && !data && order.isPending) {
    return <Page><ActivityIndicator accessibilityLabel="Đang kiểm tra thanh toán" /></Page>;
  }
  if (needsFetch && !data && order.isError) {
    return (
      <Page>
        <Text accessibilityRole="alert" testID="result-error">{errorMessage(order.error)}</Text>
        <Button mode="contained" onPress={() => order.refetch()}>Thử lại</Button>
        <Button mode="outlined" onPress={onHome}>Về trang chủ</Button>
      </Page>
    );
  }
  if (!data?.courseId) {
    return (
      <Page>
        <Text variant="titleMedium" testID="result-empty">Không có thông tin thanh toán</Text>
        <Button mode="outlined" onPress={onHome}>Về trang chủ</Button>
      </Page>
    );
  }

  if (data.status === 'FAILED') {
    return (
      <Page>
        <Text style={{ fontSize: 48, color: '#DC2626' }} accessibilityLabel="Thất bại">✕</Text>
        <Text variant="headlineSmall" testID="result-title">Thanh toán không thành công</Text>
        <Text style={{ textAlign: 'center' }}>Giao dịch bị hủy hoặc bị từ chối. Bạn chưa bị trừ tiền cho khóa học này.</Text>
        {data.txnRef ? <Text testID="result-txn">Mã giao dịch: {data.txnRef}</Text> : null}
        <Button mode="contained" testID="result-retry" onPress={() => onRetry?.(data.courseId)}>Thử lại</Button>
        <Button mode="outlined" onPress={onHome}>Về trang chủ</Button>
      </Page>
    );
  }
  if (data.status === 'PENDING') {
    return (
      <Page>
        <Text style={{ fontSize: 48 }} accessibilityLabel="Đang chờ">⏳</Text>
        <Text variant="headlineSmall" testID="result-title">Đang chờ xác nhận thanh toán</Text>
        <Text style={{ textAlign: 'center' }}>Hệ thống chưa nhận được kết quả từ VNPay. Vui lòng kiểm tra lại sau ít phút.</Text>
        {data.txnRef ? <Text testID="result-txn">Mã giao dịch: {data.txnRef}</Text> : null}
        <Button mode="contained" testID="result-refresh" loading={order.isFetching} disabled={order.isFetching}
          onPress={() => order.refetch()}>
          Kiểm tra lại
        </Button>
        <Button mode="outlined" onPress={onHome}>Về trang chủ</Button>
      </Page>
    );
  }

  const isFree = data.status === 'FREE';
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 16 }}>
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 48, color: '#16A34A' }} accessibilityLabel="Thành công">✓</Text>
        <Text variant="headlineSmall" testID="result-title">
          {isFree ? 'Đăng ký khóa học thành công' : 'Đặt hàng thành công'}
        </Text>
        <Text style={{ textAlign: 'center' }}>Bạn đã có thể bắt đầu học ngay.</Text>
      </View>

      <Card mode="outlined">
        <Card.Content style={{ gap: 6 }}>
          <Text variant="titleMedium">{data.courseTitle}</Text>
          {!isFree && <Text testID="result-txn">Mã giao dịch: {data.txnRef}</Text>}
          <Text>Số tiền: {isFree ? 'Miễn phí' : formatVND(data.amount)}</Text>
          <Text>Trạng thái: {isFree ? 'Đã ghi danh' : data.paymentMethod === 'VNPAY' ? 'Đã thanh toán (VNPay)' : 'Đã thanh toán (Mock)'}</Text>
        </Card.Content>
      </Card>

      <Button mode="contained" testID="result-learn" onPress={() => onLearn?.(data.courseId)}>Vào học ngay</Button>
      <Button mode="outlined" onPress={onMyLearning}>Khóa học của tôi</Button>
    </SafeAreaView>
  );
}
