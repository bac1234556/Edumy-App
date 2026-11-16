import React from 'react';
import { FlatList, Image, View } from 'react-native';
import { ActivityIndicator, Button, Card, ProgressBar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { errorMessage } from '../api/client';
import { MY_COURSES_KEY, fetchMyCourses } from '../api/learning';

function Centered({ children }) {
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 }}>{children}</View>;
}

function EnrollmentCard({ item, onPress }) {
  const percent = Math.max(0, Math.min(100, item.progressPercent || 0));
  const done = percent === 100;
  return (
    <Card mode="outlined" onPress={() => onPress?.(item)} testID={`enrollment-${item.id}`}>
      <View style={{ flexDirection: 'row', padding: 12, gap: 12 }}>
        {item.thumbnailUrl ? <Image source={{ uri: item.thumbnailUrl }} style={{ width: 96, height: 64, borderRadius: 4 }} /> : null}
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="titleSmall" numberOfLines={2}>{item.courseTitle}</Text>
          {item.instructorName ? <Text variant="bodySmall">{item.instructorName}</Text> : null}
          <ProgressBar progress={percent / 100} accessibilityLabel={`Tiến độ ${percent}%`} />
          <Text variant="bodySmall">
            {done ? 'Đã hoàn thành' : `${percent}% hoàn thành`}
            {item.totalLessons ? ` · ${item.completedLessons || 0}/${item.totalLessons} bài` : ''}
          </Text>
        </View>
      </View>
    </Card>
  );
}

export function MyLearningScreen({ onBack, onExplore, onOpenCourse }) {
  const enrollments = useQuery({ queryKey: MY_COURSES_KEY, queryFn: fetchMyCourses });

  let body;
  if (enrollments.isPending) {
    body = <Centered><ActivityIndicator accessibilityLabel="Đang tải khóa học của tôi" /></Centered>;
  } else if (enrollments.isError) {
    body = (
      <Centered>
        <Text accessibilityRole="alert">{errorMessage(enrollments.error)}</Text>
        <Button mode="contained" onPress={() => enrollments.refetch()}>Thử lại</Button>
      </Centered>
    );
  } else if (!enrollments.data?.length) {
    body = (
      <Centered>
        <Text variant="titleMedium">Bạn chưa mua khóa học nào</Text>
        <Button mode="contained" onPress={onExplore}>Khám phá khóa học</Button>
      </Centered>
    );
  } else {
    body = (
      <FlatList
        data={enrollments.data}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => <EnrollmentCard item={item} onPress={onOpenCourse} />}
        refreshing={enrollments.isRefetching}
        onRefresh={() => enrollments.refetch()}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
        <Button onPress={onBack}>← Quay lại</Button>
        <Text variant="titleLarge">Khóa học của tôi</Text>
      </View>
      {body}
    </SafeAreaView>
  );
}
