import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, ScrollView, StatusBar, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Button, Divider, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as ScreenOrientation from 'expo-screen-orientation';
import { errorMessage } from '../api/client';
import { fetchCourseCurriculum, fetchLesson } from '../api/player';

const SEEK_SECONDS = 10;
const BLACK = '#000000';

function Centered({ children, style }) {
  return <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 }, style]}>{children}</View>;
}

function formatDuration(seconds) {
  if (!seconds) return '';
  const s = Math.floor(seconds);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function flattenLessons(curriculum) {
  return (curriculum || []).flatMap((section) => section.lessons || []);
}

async function lockOrientation(landscape) {
  try {
    await ScreenOrientation.lockAsync(landscape
      ? ScreenOrientation.OrientationLock.LANDSCAPE
      : ScreenOrientation.OrientationLock.PORTRAIT_UP);
  } catch { /* Thiết bị không hỗ trợ khóa hướng: vẫn hiển thị toàn màn hình. */ }
}

/**
 * Một player cho cả màn học (kết luận spike W7-D2): tạo bằng link đầu tiên, đổi bài bằng replace().
 * expo-video 1.1 trên Android không nhận source null, nên chỉ mount khi đã có link video.
 */
function LessonVideo({ url }) {
  const firstUrl = useRef(url).current;
  const player = useVideoPlayer(firstUrl, (p) => p.play());
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const currentUrl = useRef(firstUrl);

  useEffect(() => {
    const subs = [
      player.addListener('playingChange', (isPlaying) => setPlaying(isPlaying)),
      player.addListener('statusChange', (next, _old, err) => {
        setStatus(next);
        setError(next === 'error' ? err?.message || 'Không phát được video' : null);
      }),
    ];
    return () => subs.forEach((s) => s.remove());
  }, [player]);

  useEffect(() => {
    if (url === currentUrl.current) return;
    currentUrl.current = url;
    player.replace(url);
    player.play();
  }, [player, url]);

  useEffect(() => () => { lockOrientation(false); }, []);

  const toggleFullscreen = (on) => {
    setFullscreen(on);
    lockOrientation(on);
  };

  const controls = (
    <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 8, paddingVertical: 8 }}>
      <Button compact mode="outlined" testID="player-back10" onPress={() => player.seekBy(-SEEK_SECONDS)}>-10s</Button>
      <Button compact mode="contained" testID="player-toggle" onPress={() => (player.playing ? player.pause() : player.play())}>
        {playing ? 'Tạm dừng' : 'Phát'}
      </Button>
      <Button compact mode="outlined" testID="player-fwd10" onPress={() => player.seekBy(SEEK_SECONDS)}>+10s</Button>
      <Button compact mode="outlined" testID="player-fullscreen" onPress={() => toggleFullscreen(!fullscreen)}>
        {fullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
      </Button>
    </View>
  );

  const video = (
    <View style={{ flex: 1, backgroundColor: BLACK, justifyContent: 'center' }}>
      <VideoView testID="player-video" style={{ width: '100%', height: '100%' }} player={player} contentFit="contain" />
      {status === 'loading' && (
        <ActivityIndicator style={{ position: 'absolute', alignSelf: 'center' }} accessibilityLabel="Đang tải video" />
      )}
      {!!error && (
        <Text style={{ position: 'absolute', alignSelf: 'center', color: '#FCA5A5' }} accessibilityRole="alert">{error}</Text>
      )}
    </View>
  );

  return (
    <View>
      {/* Player chỉ gắn vào một VideoView tại một thời điểm: khi toàn màn hình, ô inline để trống. */}
      <View style={{ aspectRatio: 16 / 9 }}>{fullscreen ? <View style={{ flex: 1, backgroundColor: BLACK }} /> : video}</View>
      {!fullscreen && controls}
      <Modal visible={fullscreen} animationType="fade" statusBarTranslucent
        supportedOrientations={['portrait', 'landscape']} onRequestClose={() => toggleFullscreen(false)}>
        <View style={{ flex: 1, backgroundColor: BLACK }} testID="player-fullscreen-view">
          <StatusBar hidden />
          {video}
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(15,23,42,0.6)' }}>{controls}</View>
        </View>
      </Modal>
    </View>
  );
}

export function CoursePlayerScreen({ courseId, initialLessonId, onBack, onBuy }) {
  const course = useQuery({ queryKey: ['player-course', courseId], queryFn: () => fetchCourseCurriculum(courseId) });
  const lessons = useMemo(() => flattenLessons(course.data?.curriculum), [course.data]);
  const [selectedId, setSelectedId] = useState(initialLessonId ? Number(initialLessonId) : null);
  const lessonId = selectedId ?? lessons[0]?.id ?? null;

  const lesson = useQuery({
    queryKey: ['player-lesson', courseId, lessonId],
    queryFn: () => fetchLesson(courseId, lessonId),
    enabled: !!lessonId,
    // Giữ link bài cũ khi đang tải bài mới để player không bị tạo lại.
    placeholderData: (previous) => previous,
    retry: (count, error) => error?.response?.status !== 403 && count < 1,
  });

  let videoArea;
  if (lesson.isError) {
    const forbidden = lesson.error?.response?.status === 403;
    videoArea = (
      <View style={{ aspectRatio: 16 / 9 }}>
        <Centered style={{ backgroundColor: '#0F172A' }}>
          <Text style={{ color: '#FFFFFF', textAlign: 'center' }} accessibilityRole="alert" testID="player-lesson-error">
            {errorMessage(lesson.error)}
          </Text>
          {forbidden
            ? <Button mode="contained" onPress={() => onBuy?.(courseId)}>Mua khóa học</Button>
            : <Button mode="contained" onPress={() => lesson.refetch()}>Thử lại</Button>}
        </Centered>
      </View>
    );
  } else if (lesson.data?.videoUrl) {
    videoArea = <LessonVideo url={lesson.data.videoUrl} />;
  } else if (lesson.isSuccess) {
    videoArea = (
      <View style={{ aspectRatio: 16 / 9 }}>
        <Centered style={{ backgroundColor: '#0F172A' }}>
          <Text style={{ color: '#FFFFFF' }} testID="player-no-video">Bài học này chưa có video</Text>
        </Centered>
      </View>
    );
  } else {
    videoArea = (
      <View style={{ aspectRatio: 16 / 9 }}>
        <Centered style={{ backgroundColor: BLACK }}><ActivityIndicator accessibilityLabel="Đang tải video" /></Centered>
      </View>
    );
  }

  let body;
  if (course.isPending) {
    body = <Centered><ActivityIndicator accessibilityLabel="Đang tải bài học" /></Centered>;
  } else if (course.isError) {
    body = (
      <Centered>
        <Text accessibilityRole="alert">{errorMessage(course.error)}</Text>
        <Button mode="contained" onPress={() => course.refetch()}>Thử lại</Button>
      </Centered>
    );
  } else if (!lessons.length) {
    body = <Centered><Text variant="titleMedium" testID="player-empty">Khóa học chưa có bài học nào</Text></Centered>;
  } else {
    body = (
      <View style={{ flex: 1 }}>
        {videoArea}
        <Text variant="titleMedium" style={{ paddingHorizontal: 16 }} numberOfLines={2} testID="player-title">
          {lessons.find((l) => l.id === lessonId)?.title}
        </Text>
        <Divider style={{ marginTop: 8 }} />
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {course.data.curriculum.map((section) => (
            <View key={section.id}>
              <Text variant="labelLarge" style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>{section.title}</Text>
              {(section.lessons || []).map((item) => {
                const active = item.id === lessonId;
                return (
                  <TouchableOpacity key={item.id} testID={`lesson-${item.id}`} onPress={() => setSelectedId(item.id)}
                    accessibilityState={{ selected: active }}
                    style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8,
                      backgroundColor: active ? '#EFF6FF' : 'transparent' }}>
                    <Text style={{ color: active ? '#2563EB' : '#64748B' }}>{active ? '▶' : '•'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: active ? '700' : '400', color: active ? '#2563EB' : '#0F172A' }}>{item.title}</Text>
                      <Text variant="bodySmall">
                        {formatDuration(item.durationSeconds)}{active ? ' · Đang phát' : ''}{item.isPreview ? ' · Xem thử' : ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
        <Button onPress={onBack}>← Quay lại</Button>
        <Text variant="titleMedium" style={{ flex: 1 }} numberOfLines={1}>{course.data?.title || 'Học bài'}</Text>
      </View>
      {body}
    </SafeAreaView>
  );
}
