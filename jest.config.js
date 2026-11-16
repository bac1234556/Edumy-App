// jest.config.js
process.env.EXPO_PUBLIC_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.2.2:5000/api/v1';
process.env.EXPO_PUBLIC_WEB_BASE_URL =
  process.env.EXPO_PUBLIC_WEB_BASE_URL || 'http://localhost:3000';

module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: [
    '@testing-library/react-native/extend-expect',
    '<rootDir>/jest.setup.js',
  ],
  modulePathIgnorePatterns: ['<rootDir>/legacy/'],
  testPathIgnorePatterns: ['<rootDir>/legacy/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
};
