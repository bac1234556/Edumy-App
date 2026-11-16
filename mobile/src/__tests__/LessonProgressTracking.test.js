import React from 'react';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import { useVideoPlayer } from 'expo-video';
import { fetchCourseCurriculum, fetchLesson } from '../api/player';
import { fetchResume, saveLessonProgress } from '../api/progress';
import { CoursePlayerScreen } from '../screens/CoursePlayerScreen';
import { buildProgressPayload } from '../hooks/useLessonProgress';

jest.mock('../api/player', () => ({ fetchCourseCurriculum: jest.fn(), fetchLesson: jest.fn() }));
jest.mock('../api/progress', () => ({
  resumeKey: (id) => ['learning', 'resume', id], fetchResume: jest.fn(), saveLessonProgress: jest.fn(),
}));
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
const RESUME = {
  courseId: 7, lessonId: 12, positionSec: 42, completed: false,
  progressPercent: 50, completedLessons: 1, totalLessons: 2, completedLessonIds: [11],
};
const lessonData = (id) => ({ id, courseId: 7, title: `Bài ${id}`, videoUrl: `https://cdn/v${id}.mp4` });
const SAVED = { lessonId: 12, completed: false, progressPercent: 50, completedLessons: 1, totalLessons: 2 };

let player;
const clients = [];

function makePlayer() {
  const listeners = {};
  return {
    currentTime: 0, duration: 90, playing: false, status: 'loading',
    play: jest.fn(), pause: jest.fn(), seekBy: jest.fn(), replace: jest.fn(),
    addListener: jest.fn((event, cb) => {
      listeners[event] = [...(listeners[event] || []), cb];
      return { remove: jest.fn(() => { listeners[event] = listeners[event].filter((x) => x !== cb); }) };
    }),
    emit: (event, ...args) => (listeners[event] || []).forEach((cb) => cb(...args)),
  };
}

function renderPlayer(props = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  clients.push(client);
  return render(<QueryClientProvider client={client}><PaperProvider theme={{ ...MD3LightTheme, animation: { scale: 0 } }}>
    <CoursePlayerScreen courseId={7} {...props} />
  </PaperProvider></QueryClientProvider>);
}

async function openAndReady(props) {
  const view = renderPlayer(props);
  await view.findByTestId('player-video');
  act(() => { player.emit('statusChange', 'readyToPlay', 'loading'); });
  return view;
}

beforeEach(() => {
  jest.useFakeTimers();
  player = makePlayer();
  useVideoPlayer.mockImplementation((source, setup) => { setup?.(player); return player; });
  fetchCourseCurriculum.mockResolvedValue(COURSE);
  fetchLesson.mockImplementation((courseId, id) => Promise.resolve(lessonData(id)));
  fetchResume.mockResolvedValue(RESUME);
  saveLessonProgress.mockResolvedValue(SAVED);
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((c) => c.clear());
  act(() => { jest.runOnlyPendingTimers(); });
  jest.useRealTimers();
});

describe('buildProgressPayload', () => {
  test('floors the position and marks completed from 90% of the duration', () => {
    expect(buildProgressPayload(12.9, 100)).toEqual({ positionSec: 12, completed: false });
    expect(buildProgressPayload(89.9, 100)).toEqual({ positionSec: 89, completed: false });
    expect(buildProgressPayload(90, 100)).toEqual({ positionSec: 90, completed: true });
  });

  test('handles unknown duration, invalid time and forced completion', () => {
    expect(buildProgressPayload(50, 0)).toEqual({ positionSec: 50, completed: false });
    expect(buildProgressPayload(NaN, NaN)).toEqual({ positionSec: 0, completed: false });
    expect(buildProgressPayload(5, 0, true)).toEqual({ positionSec: 5, completed: true });
  });
});

describe('resume', () => {
  test('opens the last watched lesson and seeks to the saved second', async () => {
    await openAndReady();
    expect(fetchLesson).toHaveBeenCalledWith(7, 12);
    expect(fetchLesson).not.toHaveBeenCalledWith(7, 11);
    expect(player.currentTime).toBe(42);
  });

  test('a lesson that is already completed restarts from the beginning', async () => {
    fetchResume.mockResolvedValue({ ...RESUME, completed: true, positionSec: 88 });
    await openAndReady();
    expect(player.currentTime).toBe(0);
  });

  test('the saved position is only applied once, not when switching lessons', async () => {
    const view = await openAndReady();
    expect(player.currentTime).toBe(42);
    player.currentTime = 0;
    fireEvent.press(view.getByTestId('lesson-11'));
    await waitFor(() => expect(player.replace).toHaveBeenCalledWith('https://cdn/v11.mp4'));
    fireEvent.press(view.getByTestId('lesson-12'));
    await waitFor(() => expect(player.replace).toHaveBeenCalledWith('https://cdn/v12.mp4'));
    act(() => { player.emit('statusChange', 'readyToPlay', 'loading'); });
    expect(player.currentTime).toBe(0);
  });

  test('an explicit lesson in the route wins over the resume point', async () => {
    renderPlayer({ initialLessonId: 11 });
    await waitFor(() => expect(fetchLesson).toHaveBeenCalledWith(7, 11));
    expect(fetchLesson).not.toHaveBeenCalledWith(7, 12);
  });
});

describe('completion ticks and progress', () => {
  test('lessons already completed get a tick and the course progress is shown', async () => {
    const view = await openAndReady();
    expect(view.getByTestId('lesson-done-11')).toBeTruthy();
    expect(view.queryByTestId('lesson-done-12')).toBeNull();
    expect(view.getByTestId('player-progress').props.children.join('')).toContain('50%');
  });

  test('finishing a lesson adds its tick and updates the progress without reloading', async () => {
    saveLessonProgress.mockResolvedValue({ lessonId: 12, completed: true, progressPercent: 100, completedLessons: 2, totalLessons: 2 });
    const view = await openAndReady();
    player.currentTime = 85;
    player.playing = true;
    act(() => { jest.advanceTimersByTime(1000); });
    act(() => { player.emit('playToEnd'); });
    await waitFor(() => expect(view.getByTestId('lesson-done-12')).toBeTruthy());
    expect(view.getByTestId('player-progress').props.children.join('')).toContain('100%');
    expect(saveLessonProgress).toHaveBeenCalledWith(12, { positionSec: 85, completed: true });
  });
});

describe('course completed', () => {
  test('shows a certificate shortcut once the course is 100% done', async () => {
    fetchResume.mockResolvedValue({ ...RESUME, progressPercent: 100, completedLessons: 2, completedLessonIds: [11, 12] });
    const onCertificate = jest.fn();
    const view = renderPlayer({ onCertificate });
    expect(await view.findByTestId('player-course-done')).toBeTruthy();
    fireEvent.press(view.getByTestId('player-certificate'));
    expect(onCertificate).toHaveBeenCalledWith(7);
  });

  test('no certificate shortcut while the course is not finished', async () => {
    const view = renderPlayer({ onCertificate: jest.fn() });
    await view.findByTestId('player-progress');
    expect(view.queryByTestId('player-certificate')).toBeNull();
  });
});

describe('saving the watch position', () => {
  test('saves every 10 seconds while playing', async () => {
    await openAndReady();
    player.currentTime = 25;
    player.playing = true;
    act(() => { jest.advanceTimersByTime(9000); });
    expect(saveLessonProgress).not.toHaveBeenCalled();
    act(() => { jest.advanceTimersByTime(1000); });
    expect(saveLessonProgress).toHaveBeenCalledWith(12, { positionSec: 25, completed: false });
  });

  test('does not save while paused', async () => {
    await openAndReady();
    player.currentTime = 25;
    player.playing = false;
    act(() => { jest.advanceTimersByTime(30000); });
    expect(saveLessonProgress).not.toHaveBeenCalled();
  });

  test('saves right away when the video is paused', async () => {
    await openAndReady();
    player.currentTime = 33.7;
    act(() => { player.emit('playingChange', false, true); });
    expect(saveLessonProgress).toHaveBeenCalledWith(12, { positionSec: 33, completed: false });
  });

  test('saves when leaving the screen', async () => {
    const view = await openAndReady();
    player.currentTime = 61;
    player.playing = true;
    act(() => { jest.advanceTimersByTime(1000); });
    view.unmount();
    expect(saveLessonProgress).toHaveBeenCalledWith(12, { positionSec: 61, completed: false });
  });

  test('leaving within the first second never overwrites the saved position with 0', async () => {
    const view = await openAndReady();
    view.unmount();
    expect(saveLessonProgress).not.toHaveBeenCalled();
  });

  test('does not save before the video is ready (the resume seek is not applied yet)', async () => {
    const view = renderPlayer();
    await view.findByTestId('player-video');
    player.currentTime = 0;
    player.playing = true;
    act(() => { jest.advanceTimersByTime(30000); });
    expect(saveLessonProgress).not.toHaveBeenCalled();
  });

  test('watching 90% marks the lesson completed without any button', async () => {
    await openAndReady();
    player.currentTime = 82;
    player.duration = 90;
    player.playing = true;
    act(() => { jest.advanceTimersByTime(10000); });
    expect(saveLessonProgress).toHaveBeenCalledWith(12, { positionSec: 82, completed: true });
  });

  test('a failed save is retried at the next interval', async () => {
    saveLessonProgress.mockRejectedValueOnce(new Error('Network Error')).mockResolvedValue(SAVED);
    await openAndReady();
    player.currentTime = 25;
    player.playing = true;
    act(() => { jest.advanceTimersByTime(10000); });
    await act(async () => { await Promise.resolve(); });
    act(() => { jest.advanceTimersByTime(10000); });
    expect(saveLessonProgress).toHaveBeenCalledTimes(2);
  });

  test('switching lessons saves the old lesson under its own id', async () => {
    const view = await openAndReady();
    player.currentTime = 50;
    player.playing = true;
    act(() => { jest.advanceTimersByTime(1000); });
    fireEvent.press(view.getByTestId('lesson-11'));
    await waitFor(() => expect(player.replace).toHaveBeenCalledWith('https://cdn/v11.mp4'));
    expect(saveLessonProgress).toHaveBeenCalledWith(12, { positionSec: 50, completed: false });
    expect(saveLessonProgress).not.toHaveBeenCalledWith(11, expect.anything());
  });

  test('does not track progress for someone who is not enrolled (resume returns 403)', async () => {
    fetchResume.mockRejectedValue({ response: { status: 403 } });
    const view = renderPlayer();
    await view.findByTestId('player-video');
    act(() => { player.emit('statusChange', 'readyToPlay', 'loading'); });
    player.currentTime = 25;
    player.playing = true;
    act(() => { jest.advanceTimersByTime(30000); });
    expect(saveLessonProgress).not.toHaveBeenCalled();
    expect(view.queryByTestId('player-progress')).toBeNull();
  });
});

describe('TEXT lesson', () => {
  const textLesson = { id: 11, courseId: 7, title: 'Bài đọc', videoUrl: null };

  test('shows a Complete button that marks the lesson completed', async () => {
    fetchResume.mockResolvedValue({ ...RESUME, lessonId: 11, completedLessonIds: [], completedLessons: 0, progressPercent: 0 });
    fetchLesson.mockResolvedValue(textLesson);
    saveLessonProgress.mockResolvedValue({ lessonId: 11, completed: true, progressPercent: 50, completedLessons: 1, totalLessons: 2 });
    const view = renderPlayer();
    fireEvent.press(await view.findByTestId('lesson-complete'));
    await waitFor(() => expect(saveLessonProgress).toHaveBeenCalledWith(11, { positionSec: 0, completed: true }));
    await waitFor(() => expect(view.getByText('Đã hoàn thành ✓')).toBeTruthy());
    expect(view.getByTestId('lesson-complete').props.accessibilityState.disabled).toBe(true);
    expect(view.getByTestId('lesson-done-11')).toBeTruthy();
  });

  test('already completed TEXT lesson shows the done state', async () => {
    fetchResume.mockResolvedValue({ ...RESUME, lessonId: 11, completed: true, completedLessonIds: [11] });
    fetchLesson.mockResolvedValue(textLesson);
    const view = renderPlayer();
    expect(await view.findByText('Đã hoàn thành ✓')).toBeTruthy();
  });

  test('a failed completion shows the error and keeps the button usable', async () => {
    fetchResume.mockResolvedValue({ ...RESUME, lessonId: 11, completedLessonIds: [] });
    fetchLesson.mockResolvedValue(textLesson);
    saveLessonProgress.mockRejectedValue({ response: { data: { message: 'Bạn cần mua khóa học để lưu tiến độ học' } } });
    const view = renderPlayer();
    fireEvent.press(await view.findByTestId('lesson-complete'));
    expect(await view.findByText('Bạn cần mua khóa học để lưu tiến độ học')).toBeTruthy();
    expect(view.getByText('Hoàn thành')).toBeTruthy();
  });
});
