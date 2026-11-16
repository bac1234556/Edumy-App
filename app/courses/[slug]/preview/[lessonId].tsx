// app/courses/[slug]/preview/[lessonId].tsx — Xem trước bài học
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useLessonPreview } from '../../../../src/features/catalog/hooks';
import { LessonContentViewer } from '../../../../src/components/media/LessonContentViewer';
import { Text } from '../../../../src/components/ui/Text';
import { Loading } from '../../../../src/components/ui/Loading';
import { ErrorState } from '../../../../src/components/ui/ErrorState';
import { Ionicons } from '@expo/vector-icons';

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

      {/* Media or Content Viewer */}
      <LessonContentViewer
        contentType={lesson.contentType}
        videoUrl={lesson.videoUrl}
        articleContent={lesson.articleContent}
        title={lesson.title}
      />

      {/* Lesson Details Info */}
      <ScrollView contentContainerStyle={styles.infoContainer}>
        <View style={styles.badgeRow}>
          <View style={styles.previewTag}>
            <Ionicons name="eye-outline" size={13} color="#0D9488" />
            <Text style={styles.previewTagText}>Học thử miễn phí</Text>
          </View>
          {Boolean(lesson.durationSeconds) && (
            <Text style={styles.durationText}>
              {Math.ceil((lesson.durationSeconds || 0) / 60)} phút
            </Text>
          )}
        </View>

        <Text variant="h2" style={styles.title}>
          {lesson.title}
        </Text>

        {lesson.chapterTitle && (
          <Text style={styles.chapterSubtitle}>Chương: {lesson.chapterTitle}</Text>
        )}

        <View style={styles.courseCard}>
          <Ionicons name="school-outline" size={20} color="#0D9488" />
          <View style={styles.courseMeta}>
            <Text style={styles.courseMetaLabel}>Thuộc khóa học</Text>
            <Text style={styles.courseMetaTitle}>{lesson.courseTitle}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  infoContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6FFFA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
  },
  previewTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0D9488',
    marginLeft: 4,
  },
  durationText: {
    fontSize: 12,
    color: '#64748B',
  },
  title: {
    color: '#0F172A',
    marginBottom: 6,
  },
  chapterSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
  },
  courseMeta: {
    marginLeft: 12,
    flex: 1,
  },
  courseMetaLabel: {
    fontSize: 11,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  courseMetaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 2,
  },
});
