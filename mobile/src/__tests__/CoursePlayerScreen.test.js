import React from 'react';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import { useVideoPlayer } from 'expo-video';
import * as ScreenOrientation from 'expo-screen-orientation';
import { fetchCourseCurriculum, fetchLesson } from '../api/player';
import { CoursePlayerScreen, flattenLessons } from '../screens/CoursePlayerScreen';

jest.mock('../api/player', () => ({ fetchCourseCurriculum: jest.fn(), fetchLesson: jest.fn() }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn(),
}));
jest.mock('expo-screen-orientation', () => ({
  lockAsync: jest.fn(() => Promise.resolve()),
  OrientationLock: { LANDSCAPE: 'LANDSCAPE', PORTRAIT_UP: 'PORTRAIT_UP' },
}));
jest.mock('expo-video', () => {
  const { forwardRef } = require('react');
  const { View } = require('react-native');
  return { useVideoPlayer: jest.fn(), VideoView: forwardRef((props, ref) => <View ref={ref} {...props} />) };
});

const COURSE = {
  id: 7,
  title: 'Java cơ bản',
  curriculum: [
    { id: 1, title: 'Bắt đầu học', lessons: [
      { id: 11, title: 'Giới thiệu', durationSeconds: 60, isPreview: true },
      { id: 12, title: 'Bài thực hành', durationSeconds: 90, isPreview: false },
    ] },
  ],
};
const lessonData = (id) => ({ id, courseId: 7, title: `Bài ${id}`, videoUrl: `https://cdn/v${id}.mp4` });

let player;
const clients = [];
function renderPlayer(props = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  clients.push(client);
  return render(<QueryClientProvider client={client}><PaperProvider theme={{ ...MD3LightTheme, animation: { scale: 0 } }}>
    <CoursePlayerScreen courseId={7} {...props} />
  </PaperProvider></QueryClientProvider>);
}

beforeEach(() => {
  jest.useFakeTimers();
  player = {
    playing: false, play: jest.fn(), pause: jest.fn(), seekBy: jest.fn(), replace: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  };
  useVideoPlayer.mockImplementation((source, setup) => { setup?.(player); return player; });
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((c) => c.clear());
  act(() => { jest.runOnlyPendingTimers(); });
  jest.useRealTimers();
});

test('flattenLessons keeps curriculum order', () => {
  expect(flattenLessons(COURSE.curriculum).map((l) => l.id)).toEqual([11, 12]);
  expect(flattenLessons(undefined)).toEqual([]);
});

test('loads the first lesson, plays it and highlights it in the list', async () => {
  fetchCourseCurriculum.mockResolvedValue(COURSE);
  fetchLesson.mockImplementation((courseId, id) => Promise.resolve(lessonData(id)));
  const view = renderPlayer();
  expect(view.getByLabelText('Đang tải bài học')).toBeTruthy();
  expect(await view.findByTestId('player-video')).toBeTruthy();
  expect(fetchLesson).toHaveBeenCalledWith(7, 11);
  expect(useVideoPlayer).toHaveBeenCalledWith('https://cdn/v11.mp4', expect.any(Function));
  expect(player.play).toHaveBeenCalled();
  expect(view.getByTestId('lesson-11').props.accessibilityState).toEqual({ selected: true });
  expect(view.getByText('01:00 · Đang phát · Xem thử')).toBeTruthy();
});

test('tapping another lesson switches the source on the same player', async () => {
  fetchCourseCurriculum.mockResolvedValue(COURSE);
  fetchLesson.mockImplementation((courseId, id) => Promise.resolve(lessonData(id)));
  const view = renderPlayer();
  await view.findByTestId('player-video');
  fireEvent.press(view.getByTestId('lesson-12'));
  await waitFor(() => expect(player.replace).toHaveBeenCalledWith('https://cdn/v12.mp4'));
  expect(useVideoPlayer).toHaveBeenLastCalledWith('https://cdn/v11.mp4', expect.any(Function));
  expect(view.getByTestId('lesson-12').props.accessibilityState).toEqual({ selected: true });
  expect(view.getByTestId('player-title').props.children).toBe('Bài thực hành');
});

test('opens the lesson requested in the route', async () => {
  fetchCourseCurriculum.mockResolvedValue(COURSE);
  fetchLesson.mockImplementation((courseId, id) => Promise.resolve(lessonData(id)));
  const view = renderPlayer({ initialLessonId: 12 });
  await view.findByTestId('player-video');
  expect(fetchLesson).toHaveBeenCalledWith(7, 12);
});

test('play/pause, seek ±10s and landscape fullscreen controls', async () => {
  fetchCourseCurriculum.mockResolvedValue(COURSE);
  fetchLesson.mockImplementation((courseId, id) => Promise.resolve(lessonData(id)));
  const view = renderPlayer();
  await view.findByTestId('player-video');
  fireEvent.press(view.getByTestId('player-fwd10'));
  expect(player.seekBy).toHaveBeenCalledWith(10);
  fireEvent.press(view.getByTestId('player-back10'));
  expect(player.seekBy).toHaveBeenCalledWith(-10);
  fireEvent.press(view.getByTestId('player-toggle'));
  expect(player.play).toHaveBeenCalled();
  player.playing = true;
  fireEvent.press(view.getByTestId('player-toggle'));
  expect(player.pause).toHaveBeenCalled();

  fireEvent.press(view.getByTestId('player-fullscreen'));
  expect(ScreenOrientation.lockAsync).toHaveBeenCalledWith('LANDSCAPE');
  expect(view.getByTestId('player-fullscreen-view')).toBeTruthy();
  fireEvent.press(view.getByText('Thoát toàn màn hình'));
  expect(ScreenOrientation.lockAsync).toHaveBeenLastCalledWith('PORTRAIT_UP');
});

test('not enrolled: 403 shows the server message and a buy button', async () => {
  fetchCourseCurriculum.mockResolvedValue(COURSE);
  fetchLesson.mockRejectedValue({ response: { status: 403, data: { message: 'Bạn cần mua khóa học để xem bài học này' } } });
  const onBuy = jest.fn();
  const view = renderPlayer({ initialLessonId: 12, onBuy });
  expect(await view.findByText('Bạn cần mua khóa học để xem bài học này')).toBeTruthy();
  expect(view.queryByTestId('player-video')).toBeNull();
  fireEvent.press(view.getByText('Mua khóa học'));
  expect(onBuy).toHaveBeenCalledWith(7);
  expect(fetchLesson).toHaveBeenCalledTimes(1);
});

test('empty state when the course has no lessons', async () => {
  fetchCourseCurriculum.mockResolvedValue({ id: 7, title: 'Trống', curriculum: [] });
  const view = renderPlayer();
  expect(await view.findByTestId('player-empty')).toBeTruthy();
  expect(fetchLesson).not.toHaveBeenCalled();
});

test('error state retries loading the course', async () => {
  fetchCourseCurriculum.mockRejectedValueOnce(new Error('Network Error')).mockResolvedValue(COURSE);
  fetchLesson.mockImplementation((courseId, id) => Promise.resolve(lessonData(id)));
  const view = renderPlayer();
  expect(await view.findByText('Không kết nối được máy chủ. Kiểm tra mạng và thử lại.')).toBeTruthy();
  fireEvent.press(view.getByText('Thử lại'));
  expect(await view.findByTestId('player-video')).toBeTruthy();
});
