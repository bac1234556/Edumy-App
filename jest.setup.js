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

jest.mock('expo-network', () => ({
  NetworkStateType: { NONE: 'NONE', WIFI: 'WIFI' },
  getNetworkStateAsync: jest.fn(async () => ({
    type: 'WIFI',
    isConnected: true,
    isInternetReachable: true,
  })),
}));

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(async () => ({ type: 'opened' })),
}));

jest.mock('react-native-google-mobile-ads', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: () => ({
      initialize: jest.fn(async () => []),
    }),
    TestIds: {
      BANNER: 'ca-app-pub-3940256099942544/6300978111',
      INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
    },
    BannerAdSize: {
      BANNER: 'BANNER',
      ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
    },
    AdEventType: {
      LOADED: 'loaded',
      CLOSED: 'closed',
      ERROR: 'error',
    },
    BannerAd: (props) => React.createElement(View, { testID: 'admob-banner', ...props }),
    InterstitialAd: {
      createForAdRequest: jest.fn(() => ({
        addAdEventListener: jest.fn(() => jest.fn()),
        load: jest.fn(),
        show: jest.fn(async () => {}),
      })),
    },
  };
});


