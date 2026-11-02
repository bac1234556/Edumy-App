import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react-native';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import { useVideoPlayer } from 'expo-video';
import { SPIKE_SOURCES, VideoSpikeScreen, formatTime } from '../screens/VideoSpikeScreen';

jest.mock('expo-video', () => {
  const { forwardRef } = require('react');
  const { View } = require('react-native');
  return { useVideoPlayer: jest.fn(), VideoView: forwardRef((props, ref) => <View ref={ref} {...props} />) };
});

let listeners;
let player;

function screen() {
  return render(<PaperProvider theme={{ ...MD3LightTheme, animation: { scale: 0 } }}><VideoSpikeScreen /></PaperProvider>);
}

beforeEach(() => {
  jest.useFakeTimers();
  listeners = {};
  player = {
    currentTime: 0, duration: 0, playing: false, loop: true,
    play: jest.fn(), pause: jest.fn(), seekBy: jest.fn(), replace: jest.fn(),
    addListener: jest.fn((event, cb) => { listeners[event] = cb; return { remove: jest.fn() }; }),
  };
  useVideoPlayer.mockImplementation((source, setup) => { setup?.(player); return player; });
});
afterEach(() => {
  cleanup();
  jest.useRealTimers();
});

test('formatTime renders mm:ss and guards invalid values', () => {
  expect(formatTime(0)).toBe('00:00');
  expect(formatTime(75.9)).toBe('01:15');
  expect(formatTime(NaN)).toBe('--:--');
});

test('creates one player for the first source and disables looping', () => {
  screen();
  expect(useVideoPlayer).toHaveBeenCalledWith(SPIKE_SOURCES[0].uri, expect.any(Function));
  expect(player.loop).toBe(false);
});

test('polls currentTime and duration from the player', () => {
  const view = screen();
  player.currentTime = 12.4;
  player.duration = 13.6;
  act(() => { jest.advanceTimersByTime(500); });
  expect(view.getByTestId('spike-time').props.children.join('')).toContain('00:12 / 00:13');
});

test('reports readyToPlay and error states from statusChange', () => {
  const view = screen();
  act(() => listeners.statusChange('readyToPlay', 'loading'));
  expect(view.getByTestId('spike-ready').props.children.join('')).toMatch(/\d+ ms/);
  act(() => listeners.statusChange('error', 'loading', { message: 'Source error' }));
  expect(view.getByText('Source error')).toBeTruthy();
});

test('switching to HLS replaces the source on the same player', () => {
  const view = screen();
  fireEvent.press(view.getByTestId('source-hls-auto'));
  expect(player.replace).toHaveBeenCalledWith(expect.stringMatching(/sp_auto\/dog\.m3u8$/));
  expect(useVideoPlayer).toHaveBeenLastCalledWith(SPIKE_SOURCES[0].uri, expect.any(Function));
});

test('seek controls use seekBy and clamp absolute seeks to duration', () => {
  const view = screen();
  player.duration = 20;
  fireEvent.press(view.getByText('+10s'));
  expect(player.seekBy).toHaveBeenCalledWith(10);
  fireEvent.press(view.getByTestId('seek-half'));
  expect(player.currentTime).toBe(10);
});
