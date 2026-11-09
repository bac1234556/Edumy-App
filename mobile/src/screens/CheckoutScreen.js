import React from 'react';
import { Image, ScrollView, View } from 'react-native';
import { ActivityIndicator, Button, Card, Divider, HelperText, RadioButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorMessage } from '../api/client';
import { MY_COURSES_KEY, checkoutCourse, fetchCheckoutCourse } from '../api/learning';
import { PriceTag } from '../components/common/PriceTag';

function Centered({ children }) {
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 }}>{children}</View>;
}

export function CheckoutScreen({ courseId, onBack, onSuccess, onLearn }) {
  const queryClient = useQueryClient();
  const course = useQuery({
    queryKey: ['checkout-course', courseId],
    queryFn: () => fetchCheckoutCourse(courseId),
    enabled: !!courseId,
  });
  const order = useMutation({
    mutationFn: () => checkoutCourse({ courseId, paymentMethod: 'MOCK' }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: MY_COURSES_KEY });
      onSuccess?.(result);
    },
  });
  const alreadyOwned = order.error?.response?.status === 409;

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
            <RadioButton.Group onValueChange={() => {}} value="MOCK">
              <RadioButton.Item mode="android" value="MOCK" label="Thanh toán mô phỏng (Mock)" />
            </RadioButton.Group>
            <Text variant="bodySmall">Thanh toán mô phỏng luôn thành công, không trừ tiền thật.</Text>
          </View>
        )}

        <Divider />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="titleMedium">Tổng thanh toán</Text>
          <PriceTag price={c.price} originalPrice={c.originalPrice} size="large" />
        </View>
        <HelperText type="error" visible={order.isError}>{order.isError ? errorMessage(order.error) : ''}</HelperText>
        {alreadyOwned ? (
          <Button mode="contained" testID="checkout-learn" onPress={() => onLearn?.(courseId)}>Vào học</Button>
        ) : (
          <Button
            mode="contained"
            testID="checkout-pay"
            loading={order.isPending}
            disabled={order.isPending}
            onPress={() => order.mutate()}
          >
            {isFree ? 'Đăng ký miễn phí' : 'Thanh toán'}
          </Button>
        )}
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
