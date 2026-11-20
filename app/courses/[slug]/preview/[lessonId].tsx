// app/courses/[slug]/preview/[lessonId].tsx — Xem trước bài học
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLessonPreview } from '../../../../src/features/catalog/hooks';
import { LessonContentViewer } from '../../../../src/components/media/LessonContentViewer';
import { Text } from '../../../../src/components/ui/Text';
import { Badge } from '../../../../src/components/ui/Badge';
import { Card } from '../../../../src/components/ui/Card';
import { Loading } from '../../../../src/components/ui/Loading';
import { ErrorState } from '../../../../src/components/ui/ErrorState';
import { ResponsiveContainer } from '../../../../src/components/ui/ResponsiveContainer';
import { layout, semantic } from '../../../../src/theme/tokens';

export default function LessonPreviewScreen() {
  const { slug, lessonId } = useLocalSearchParams<{ slug: string; lessonId: string }>();
  const numericLessonId = Number(lessonId);

  const { data: lesson, isLoading, isError, error, refetch } = useLessonPreview(
    slug || '',
    numericLessonId
  );

  if (isLoading) {
    return <Loading message="Đang tải nội dung bài học..." />;
  }

  if (isError || !lesson) {
    return (
      <ErrorState
        error={error}
        message={error?.message || 'Không thể tải bài học xem trước.'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Xem trước bài học',
          headerBackTitle: 'Quay lại',
        }}
      />

      {/* Light-mode Media or Article Viewer */}
      <LessonContentViewer
        contentType={lesson.contentType === 'video' ? 'video' : 'article'}
        videoUrl={lesson.videoUrl}
        articleContent={lesson.articleContent}
        title={lesson.title ?? ''}
      />

      {/* Lesson Details Info */}
      <ScrollView contentContainerStyle={styles.infoContainer}>
        <ResponsiveContainer maxWidth={layout.maxContentWidth}>
          <Card>
            <View style={styles.badgeRow}>
              <Badge
                variant="info"
                label="Học thử miễn phí"
                icon={<Ionicons name="eye-outline" size={13} color={semantic.brandPrimary} />}
              />
              {Boolean(lesson.durationSeconds) && (
                <Text variant="caption" tabular style={styles.durationText}>
                  {Math.ceil((lesson.durationSeconds || 0) / 60)} phút
                </Text>
              )}
            </View>

            <Text variant="h2" style={styles.title}>
              {lesson.title}
            </Text>
          </Card>
        </ResponsiveContainer>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.surfaceCanvas,
  },
  infoContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  durationText: {
    color: semantic.textMuted,
    fontWeight: '600',
  },
  title: {
    color: semantic.textPrimary,
  },
});
