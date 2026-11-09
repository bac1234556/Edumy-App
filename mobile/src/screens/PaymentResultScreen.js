import React from 'react';
import { View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount) || 0);
}

export function PaymentResultScreen({ result, onLearn, onMyLearning, onHome }) {
  if (!result?.courseId) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 }}>
        <Text variant="titleMedium" testID="result-empty">Không có thông tin thanh toán</Text>
        <Button mode="outlined" onPress={onHome}>Về trang chủ</Button>
      </SafeAreaView>
    );
  }

  const isFree = result.status === 'FREE';
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
          <Text variant="titleMedium">{result.courseTitle}</Text>
          {!isFree && <Text testID="result-txn">Mã giao dịch: {result.txnRef}</Text>}
          <Text>Số tiền: {isFree ? 'Miễn phí' : formatVND(result.amount)}</Text>
          <Text>Trạng thái: {isFree ? 'Đã ghi danh' : 'Đã thanh toán (Mock)'}</Text>
        </Card.Content>
      </Card>

      <Button mode="contained" testID="result-learn" onPress={() => onLearn?.(result.courseId)}>Vào học ngay</Button>
      <Button mode="outlined" onPress={onMyLearning}>Khóa học của tôi</Button>
    </SafeAreaView>
  );
}
