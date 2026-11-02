import React from 'react';
import { View } from 'react-native';
import { ActivityIndicator, Button, Card, Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { authClient, errorMessage } from '../api/client';

export function HealthCard() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: async () => (await authClient.get('/health')).data.data,
    retry: 1,
  });
  return (
    <Card mode="outlined" style={{ marginVertical: 16 }}>
      <Card.Content>
        <Text variant="titleMedium">Kết nối Edumy</Text>
        {health.isPending ? <ActivityIndicator accessibilityLabel="Đang kiểm tra kết nối" />
          : health.isError ? <Text accessibilityRole="alert">{errorMessage(health.error)}</Text>
            : <Text>{health.data?.status === 'UP' ? 'Máy chủ đang hoạt động (UP)' : 'Chưa có thông tin máy chủ'}</Text>}
        <View style={{ alignItems: 'flex-start' }}>
          <Button onPress={() => health.refetch()} loading={health.isFetching} disabled={health.isFetching}>
            Kiểm tra lại
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
}
