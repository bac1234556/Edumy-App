import React from 'react';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import { useVideoPlayer } from 'expo-video';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Animated } from 'react-native';
import { fetchCourseCurriculum, fetchLesson } from '../api/player';
import {
  acceptQuestionAnswer,
  createLessonQuestion,
  createQuestionAnswer,
  fetchLessonQuestions,
} from '../api/qa';
import { useAuthStore } from '../store/authStore';
import { CoursePlayerScreen, flattenLessons } from '../screens/CoursePlayerScreen';

jest.mock('../api/player', () => ({
  fetchCourseCurriculum: jest.fn(),
  fetchLesson: jest.fn(),
  fetchInstructorLesson: jest.fn(),
}));
jest.mock('../api/qa', () => ({
  acceptQuestionAnswer: jest.fn(),
  createLessonQuestion: jest.fn(),
  createQuestionAnswer: jest.fn(),
  fetchLessonQuestions: jest.fn(),
}));
jest.mock('../store/authStore', () => ({
  useAuthStore: jest.fn((selector) => selector({ session: { user: { id: 5 } } })),
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn(),
}));
jest.mock('react-native-paper', () => {
  const React = require('react');
  const Paper = jest.requireActual('react-native-paper');
  const {
    Text: NativeText,
    TextInput: NativeTextInput,
    TouchableOpacity,
    View: NativeView,
  } = require('react-native');
  return {
    ...Paper,
    TextInput: React.forwardRef((props, ref) => <NativeTextInput ref={ref} {...props} />),
    ActivityIndicator: ({ accessibilityLabel, color, size, ...props }) => (
      <NativeView accessible accessibilityLabel={accessibilityLabel} {...props} />
    ),
    Button: ({ children, disabled, loading, onPress, testID }) => (
      <TouchableOpacity
        accessibilityRole="button"
        disabled={disabled || loading}
        onPress={onPress}
        testID={testID}
      >
        <NativeText>{children}</NativeText>
      </TouchableOpacity>
    ),
    SegmentedButtons: ({ buttons, onValueChange }) => (
      <NativeView>
        {buttons.map((button) => (
          <TouchableOpacity
            key={button.value}
            accessibilityRole="button"
            onPress={() => onValueChange(button.value)}
            testID={button.testID}
          >
            <NativeText>{button.label}</NativeText>
          </TouchableOpacity>
        ))}
      </NativeView>
    ),
  };
});
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
  instructor: { id: 2 },
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
  const noAnimation = () => ({
    start: (callback) => callback?.({ finished: true }),
    stop: jest.fn(),
    reset: jest.fn(),
  });
  jest.spyOn(Animated, 'timing').mockImplementation(noAnimation);
  jest.spyOn(Animated, 'loop').mockImplementation(noAnimation);
  useAuthStore.mockImplementation((selector) => selector({ session: { user: { id: 5 } } }));
  fetchLessonQuestions.mockReset();
  createLessonQuestion.mockReset();
  createQuestionAnswer.mockReset();
  acceptQuestionAnswer.mockReset();
  player = {
    playing: false, play: jest.fn(), pause: jest.fn(), seekBy: jest.fn(), replace: jest.fn(),
    addListener: jest.fn((event, listener) => {
      if (event === 'playingChange') listener(false);
      if (event === 'statusChange') listener('readyToPlay', 'loading', null);
      return { remove: jest.fn() };
    }),
  };
  useVideoPlayer.mockImplementation((source, setup) => { setup?.(player); return player; });
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((c) => c.clear());
  jest.restoreAllMocks();
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

test('Q&A tab has an empty state and submits a question that appears in the refreshed list', async () => {
  fetchCourseCurriculum.mockResolvedValue(COURSE);
  fetchLesson.mockImplementation((courseId, id) => Promise.resolve(lessonData(id)));
  fetchLessonQuestions
    .mockResolvedValueOnce({ content: [], page: 0, last: true })
    .mockResolvedValue({ content: [{
      id: 21,
      lessonId: 11,
      authorId: 5,
      title: 'Câu hỏi mới',
      content: 'Câu hỏi mới',
      answerCount: 0,
      hasAcceptedAnswer: false,
      answers: [],
    }], page: 0, last: true });
  createLessonQuestion.mockResolvedValue({ id: 21 });

  const view = renderPlayer();
  await view.findByTestId('player-video');
  fireEvent.press(view.getByText('Hỏi đáp'));
  expect(await view.findByText('Chưa có câu hỏi nào cho bài học này.')).toBeTruthy();

  fireEvent.press(view.getByTestId('qa-open-question-form'));
  fireEvent.changeText(view.getByTestId('qa-question-content'), '  Câu hỏi mới  ');
  fireEvent.press(view.getByTestId('qa-submit-question'));

  await waitFor(() => expect(createLessonQuestion).toHaveBeenCalledWith(11, 'Câu hỏi mới'));
  expect(await view.findByTestId('qa-question-21')).toBeTruthy();
});

test('Q&A validates an empty question without making an API request', async () => {
  fetchCourseCurriculum.mockResolvedValue(COURSE);
  fetchLesson.mockImplementation((courseId, id) => Promise.resolve(lessonData(id)));
  fetchLessonQuestions.mockResolvedValue({ content: [], page: 0, last: true });

  const view = renderPlayer();
  await view.findByTestId('player-video');
  fireEvent.press(view.getByText('Hỏi đáp'));
  fireEvent.press(await view.findByTestId('qa-open-question-form'));
  fireEvent.press(view.getByTestId('qa-submit-question'));

  expect(await view.findByText('Nội dung câu hỏi không được để trống.')).toBeTruthy();
  expect(createLessonQuestion).not.toHaveBeenCalled();
});

test('Q&A error state retries loading the lesson questions', async () => {
  fetchCourseCurriculum.mockResolvedValue(COURSE);
  fetchLesson.mockImplementation((courseId, id) => Promise.resolve(lessonData(id)));
  fetchLessonQuestions
    .mockRejectedValueOnce({ response: { data: { message: 'Không thể tải câu hỏi' } } })
    .mockResolvedValue({ content: [], page: 0, last: true });

  const view = renderPlayer();
  await view.findByTestId('player-video');
  fireEvent.press(view.getByText('Hỏi đáp'));
  expect(await view.findByText('Không thể tải câu hỏi')).toBeTruthy();
  fireEvent.press(view.getByText('Thử lại'));
  expect(await view.findByText('Chưa có câu hỏi nào cho bài học này.')).toBeTruthy();
});

test('Q&A details show the instructor badge and accepted answer marker', async () => {
  fetchCourseCurriculum.mockResolvedValue(COURSE);
  fetchLesson.mockImplementation((courseId, id) => Promise.resolve(lessonData(id)));
  fetchLessonQuestions.mockResolvedValue({
    content: [{
      id: 21,
      lessonId: 11,
      authorId: 5,
      title: 'Câu hỏi',
      content: 'Nội dung câu hỏi',
      answerCount: 1,
      hasAcceptedAnswer: true,
      answers: [{ id: 31, authorId: 2, content: 'Câu trả lời của giảng viên', accepted: true }],
    }],
    page: 0,
    last: true,
  });

  const view = renderPlayer();
  await view.findByTestId('player-video');
  fireEvent.press(view.getByText('Hỏi đáp'));
  fireEvent.press(await view.findByTestId('qa-question-21'));

  expect(await view.findByTestId('qa-instructor-badge-31')).toBeTruthy();
  expect(view.getByTestId('qa-accepted-31')).toBeTruthy();
  expect(view.getByText('Câu trả lời của giảng viên')).toBeTruthy();
});

test('instructor answer is persisted and visible to a student after reopening the lesson', async () => {
  useAuthStore.mockImplementation((selector) => selector({ session: { user: { id: 2 } } }));
  fetchCourseCurriculum.mockResolvedValue({
    ...COURSE,
    instructorId: 2,
  });
  const instructorLesson = { ...lessonData(11), durationSec: 60, durationSeconds: 60 };
  const { fetchInstructorLesson } = require('../api/player');
  fetchInstructorLesson.mockReturnValue(instructorLesson);
  const unansweredQuestion = {
    content: [{
      id: 21,
      lessonId: 11,
      authorId: 5,
      title: 'Câu hỏi',
      content: 'Nội dung câu hỏi',
      answerCount: 0,
      hasAcceptedAnswer: false,
      answers: [],
    }],
    page: 0,
    last: true,
  };
  const answeredQuestion = {
    content: [{
      ...unansweredQuestion.content[0],
      answerCount: 1,
      answers: [{ id: 31, authorId: 2, content: 'Giải thích từ giảng viên', accepted: false }],
    }],
    page: 0,
    last: true,
  };
  fetchLessonQuestions
    .mockResolvedValueOnce(unansweredQuestion)
    .mockResolvedValueOnce(answeredQuestion)
    .mockResolvedValue(answeredQuestion);
  createQuestionAnswer.mockResolvedValue({ id: 31 });

  const instructorView = renderPlayer({ role: 'INSTRUCTOR' });
  await instructorView.findByTestId('player-video');
  fireEvent.press(instructorView.getByText('Hỏi đáp'));
  fireEvent.press(await instructorView.findByTestId('qa-question-21'));
  fireEvent.changeText(instructorView.getByTestId('qa-answer-content'), '  Giải thích từ giảng viên  ');
  fireEvent.press(instructorView.getByTestId('qa-submit-answer'));

  await waitFor(() => expect(createQuestionAnswer).toHaveBeenCalledWith(21, 'Giải thích từ giảng viên'));
  expect(await instructorView.findByTestId('qa-instructor-badge-31')).toBeTruthy();

  instructorView.unmount();
  useAuthStore.mockImplementation((selector) => selector({ session: { user: { id: 5 } } }));
  fetchCourseCurriculum.mockResolvedValue(COURSE);
  fetchLesson.mockImplementation((courseId, id) => Promise.resolve(lessonData(id)));
  const studentView = renderPlayer();
  await studentView.findByTestId('player-video');
  fireEvent.press(studentView.getByText('Hỏi đáp'));
  fireEvent.press(await studentView.findByTestId('qa-question-21'));

  expect(await studentView.findByText('Giải thích từ giảng viên')).toBeTruthy();
  expect(studentView.getByTestId('qa-instructor-badge-31')).toBeTruthy();
});

test('question author can accept an answer', async () => {
  fetchCourseCurriculum.mockResolvedValue(COURSE);
  fetchLesson.mockImplementation((courseId, id) => Promise.resolve(lessonData(id)));
  fetchLessonQuestions.mockResolvedValue({
    content: [{
      id: 21,
      lessonId: 11,
      authorId: 5,
      title: 'Câu hỏi',
      content: 'Nội dung câu hỏi',
      answerCount: 1,
      hasAcceptedAnswer: false,
      answers: [{ id: 31, authorId: 8, content: 'Câu trả lời', accepted: false }],
    }],
    page: 0,
    last: true,
  });
  acceptQuestionAnswer.mockResolvedValue({ id: 31, accepted: true });

  const view = renderPlayer();
  await view.findByTestId('player-video');
  fireEvent.press(view.getByText('Hỏi đáp'));
  fireEvent.press(await view.findByTestId('qa-question-21'));
  fireEvent.press(view.getByTestId('qa-accept-31'));

  await waitFor(() => expect(acceptQuestionAnswer.mock.calls[0][0]).toBe(31));
});
