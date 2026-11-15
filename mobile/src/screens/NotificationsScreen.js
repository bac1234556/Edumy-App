import React, { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Chip, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { errorMessage } from '../api/client';
import {
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  refreshUnreadCount,
} from '../api/notifications';

const PAGE_SIZE = 20;

function Centered({ children }) {
  return <View style={styles.centered}>{children}</View>;
}

export function NotificationsScreen({ onBack }) {
  const queryClient = useQueryClient();
  const notifications = useInfiniteQuery({
    queryKey: ['notifications'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchNotifications({ page: pageParam, size: PAGE_SIZE }),
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.page + 1),
  });
  const items = notifications.data?.pages.flatMap((page) => page.content) ?? [];
  const { isFetched, refetch } = notifications;

  const refreshOnFocus = useCallback(() => {
    refreshUnreadCount().catch(() => {});
    if (isFetched) refetch();
  }, [isFetched, refetch]);
  useFocusEffect(refreshOnFocus);

  const refreshListAndBadge = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      refreshUnreadCount(),
    ]);
  };

  const markReadMutation = useMutation({
    mutationFn: (id) => markNotificationAsRead(id),
    onSuccess: refreshListAndBadge,
  });
  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: refreshListAndBadge,
  });

  const renderHeader = () => (
    <View style={styles.header}>
      <Button onPress={onBack}>← Quay lại</Button>
      <Text variant="titleLarge" style={styles.title}>Thông báo</Text>
      {items.some((item) => !item.isRead) ? (
        <Button
          compact
          onPress={() => markAllMutation.mutate()}
          loading={markAllMutation.isPending}
          disabled={markAllMutation.isPending}
          testID="notifications-read-all"
        >
          Đánh dấu tất cả đã đọc
        </Button>
      ) : null}
    </View>
  );

  if (notifications.isPending) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <Centered><ActivityIndicator accessibilityLabel="Đang tải thông báo" /></Centered>
      </SafeAreaView>
    );
  }

  if (notifications.isError && !notifications.data) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <Centered>
          <Text accessibilityRole="alert">{errorMessage(notifications.error)}</Text>
          <Button mode="contained" onPress={() => notifications.refetch()}>Thử lại</Button>
        </Centered>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={items.length ? styles.listContent : styles.emptyList}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={(
          <Centered>
            <Text testID="notifications-empty">Bạn chưa có thông báo nào.</Text>
          </Centered>
        )}
        ListFooterComponent={notifications.isFetchingNextPage ? <ActivityIndicator style={styles.footer} /> : null}
        refreshControl={(
          <RefreshControl
            refreshing={notifications.isRefetching && !notifications.isFetchingNextPage}
            onRefresh={() => notifications.refetch()}
            colors={['#2563EB']}
          />
        )}
        onEndReached={() => {
          if (notifications.hasNextPage && !notifications.isFetchingNextPage) notifications.fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        renderItem={({ item }) => (
          <Card
            mode="outlined"
            style={[styles.card, !item.isRead && styles.unreadCard]}
            onPress={() => {
              if (!item.isRead && !markReadMutation.isPending) markReadMutation.mutate(item.id);
            }}
            accessibilityRole="button"
            testID={`notification-${item.id}`}
          >
            <Card.Title
              title={item.title}
              subtitle={item.type}
              right={() => (!item.isRead ? <Chip compact style={styles.unreadChip}>Mới</Chip> : null)}
            />
            <Card.Content><Text>{item.body ?? item.content}</Text></Card.Content>
          </Card>
        )}
      />
      {notifications.isError && notifications.data ? (
        <View style={styles.inlineError}>
          <Text accessibilityRole="alert">Không thể tải thêm thông báo.</Text>
          <Button onPress={() => notifications.fetchNextPage()}>Thử lại</Button>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  title: { flex: 1, marginHorizontal: 8 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  listContent: { padding: 16, gap: 10, flexGrow: 1 },
  emptyList: { flexGrow: 1 },
  card: { backgroundColor: '#FFFFFF' },
  unreadCard: { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
  unreadChip: { marginRight: 16, backgroundColor: '#DBEAFE' },
  footer: { padding: 16 },
  inlineError: { alignItems: 'center', padding: 8 },
});
