import React from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { ActivityIndicator, Button, Card, Text, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorMessage } from '../api/client';
import {
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../api/notifications';

function Centered({ children }) {
  return (
    <View style={styles.centered}>
      {children}
    </View>
  );
}

export function NotificationsScreen({ onBack }) {
  const queryClient = useQueryClient();
  const notifications = useQuery({ queryKey: ['notifications'], queryFn: fetchNotifications });

  const markReadMutation = useMutation({
    mutationFn: (id) => markNotificationAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  let content;
  if (notifications.isPending) {
    content = (
      <Centered>
        <ActivityIndicator accessibilityLabel="Đang tải thông báo" />
      </Centered>
    );
  } else if (notifications.isError) {
    content = (
      <Centered>
        <Text accessibilityRole="alert">{errorMessage(notifications.error)}</Text>
        <Button mode="contained" onPress={() => notifications.refetch()}>
          Thử lại
        </Button>
      </Centered>
    );
  } else if (!notifications.data?.content?.length) {
    content = (
      <Centered>
        <Text>Bạn chưa có thông báo nào.</Text>
      </Centered>
    );
  } else {
    content = (
      <FlatList
        data={notifications.data.content}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshing={notifications.isRefetching}
        onRefresh={() => notifications.refetch()}
        renderItem={({ item }) => (
          <Card
            mode="outlined"
            style={[styles.card, !item.isRead && styles.unreadCard]}
            onPress={() => {
              if (!item.isRead) {
                markReadMutation.mutate(item.id);
              }
            }}
          >
            <Card.Title
              title={item.title}
              subtitle={item.type}
              right={() =>
                !item.isRead ? (
                  <Chip compact style={styles.unreadChip}>
                    Mới
                  </Chip>
                ) : null
              }
            />
            <Card.Content>
              <Text>{item.body}</Text>
            </Card.Content>
          </Card>
        )}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Button onPress={onBack}>← Quay lại</Button>
        <Text variant="titleLarge" style={styles.title}>
          Thông báo
        </Text>
        {notifications.data?.content?.some((n) => !n.isRead) ? (
          <Button
            compact
            onPress={() => markAllMutation.mutate()}
            loading={markAllMutation.isPending}
          >
            Đọc tất cả
          </Button>
        ) : null}
      </View>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  title: { flex: 1, marginLeft: 8 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  listContent: { padding: 16, gap: 10 },
  card: { backgroundColor: '#ffffff' },
  unreadCard: { backgroundColor: '#f0f7ff', borderColor: '#2563EB' },
  unreadChip: { marginRight: 16, backgroundColor: '#dbeafe' },
});
