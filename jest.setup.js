// jest.setup.js
// Set default environment variables for test execution
process.env.EXPO_PUBLIC_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.2.2:5000/api/v1';
process.env.EXPO_PUBLIC_WEB_BASE_URL =
  process.env.EXPO_PUBLIC_WEB_BASE_URL || 'http://localhost:3000';
