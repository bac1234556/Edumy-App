import React, { useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { ActivityIndicator, Button, Card, Divider, HelperText, RadioButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery } from '@tanstack/react-query';
import { errorMessage } from '../api/client';
import { createOrder, fetchCheckoutCourse } from '../api/learning';
import { PriceTag } from '../components/common/PriceTag';

const PAYMENT_METHODS = [
  { value: 'MOCK', label: 'Thanh toán mô phỏng (Mock)' },
  { value: 'VNPAY', label: 'VNPay Sandbox (sắp có)', disabled: true },
];

function Centered({ children }) {
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 }}>{children}</View>;
}

export function CheckoutScreen({ courseId, onBack, onDone }) {
  const [paymentMethod, setPaymentMethod] = useState('MOCK');
  const course = useQuery({
    queryKey: ['checkout-course', courseId],
    queryFn: () => fetchCheckoutCourse(courseId),
    enabled: !!courseId,
  });
  const order = useMutation({ mutationFn: () => createOrder({ courseId, paymentMethod }) });

  let body;
  if (!courseId || (course.isSuccess && !course.data)) {
    body = (
      <Centered>
        <Text variant="titleMedium" testID="checkout-empty">Không có khóa học để thanh toán</Text>
        <Button mode="outlined" onPress={onBack}>Quay lại</Button>
      </Centered>
    );
  } else if (course.isPending) {
    body = <Centered><ActivityIndicator accessibilityLabel="Đang tải thông tin khóa học" /></Centered>;
  } else if (course.isError) {
    body = (
      <Centered>
        <Text accessibilityRole="alert">{errorMessage(course.error)}</Text>
        <Button mode="contained" onPress={() => course.refetch()}>Thử lại</Button>
      </Centered>
    );
  } else if (order.isSuccess) {
    body = (
      <Centered>
        <Text variant="headlineSmall">Đã tạo đơn hàng</Text>
        <Text testID="checkout-txn">Mã giao dịch: {order.data.txnRef}</Text>
        <Text>Trạng thái: {order.data.status === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán'}</Text>
        <Button mode="contained" onPress={onDone}>Đến Khóa học của tôi</Button>
      </Centered>
    );
  } else {
    const c = course.data;
    const isFree = Number(c.price) === 0;
    body = (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card mode="outlined">
          {c.thumbnailUrl ? <Image source={{ uri: c.thumbnailUrl }} style={{ height: 160, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} /> : null}
          <Card.Content style={{ paddingTop: 12, gap: 4 }}>
            <Text variant="titleMedium">{c.title}</Text>
            {c.instructor?.fullName ? <Text variant="bodySmall">Giảng viên: {c.instructor.fullName}</Text> : null}
          </Card.Content>
        </Card>

        {!isFree && (
          <View>
            <Text variant="titleSmall">Phương thức thanh toán</Text>
            <RadioButton.Group onValueChange={setPaymentMethod} value={paymentMethod}>
              {PAYMENT_METHODS.map((m) => (
                <RadioButton.Item key={m.value} mode="android" value={m.value} label={m.label} disabled={m.disabled} />
              ))}
            </RadioButton.Group>
          </View>
        )}

        <Divider />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="titleMedium">Tổng thanh toán</Text>
          <PriceTag price={c.price} originalPrice={c.originalPrice} size="large" />
        </View>
        <HelperText type="error" visible={order.isError}>{order.isError ? errorMessage(order.error) : ''}</HelperText>
        <Button
          mode="contained"
          testID="checkout-pay"
          loading={order.isPending}
          disabled={order.isPending}
          onPress={() => order.mutate()}
        >
          {isFree ? 'Đăng ký miễn phí' : 'Thanh toán'}
        </Button>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
        <Button onPress={onBack}>← Quay lại</Button>
        <Text variant="titleLarge">Thanh toán</Text>
      </View>
      {body}
    </SafeAreaView>
  );
}
