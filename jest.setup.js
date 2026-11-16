/* eslint-env jest */
// jest.setup.js
// Set default environment variables for test execution
process.env.EXPO_PUBLIC_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.2.2:5000/api/v1';
process.env.EXPO_PUBLIC_WEB_BASE_URL =
  process.env.EXPO_PUBLIC_WEB_BASE_URL || 'http://localhost:3000';

// Mock native modules for Jest
jest.mock('expo-video', () => ({
  VideoView: 'VideoView',
  useVideoPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    currentTime: 0,
    duration: 100,
  })),
}));

jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    WebView: (props) => React.createElement(View, { testID: 'webview', ...props }),
  };
});

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///data/user/0/host.exp.exponent/files/',
  downloadAsync: jest.fn(async (url, fileUri) => ({
    uri: fileUri,
    status: 200,
    headers: {},
  })),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => {}),
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(async () => true),
  getStringAsync: jest.fn(async () => ''),
}));


