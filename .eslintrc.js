// .eslintrc.js
module.exports = {
  extends: ['expo'],
  ignorePatterns: ['legacy/', 'dist/', 'node_modules/', '.expo/'],
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: 'CallExpression[callee.object.name="Alert"][callee.property.name="alert"]',
        message: 'Do not call Alert.alert directly; use confirm() or notify() from src/lib/dialog.ts.',
      },
    ],
  },
  overrides: [
    {
      files: ['src/lib/dialog.ts'],
      rules: {
        'no-restricted-syntax': 'off',
      },
    },
  ],
};
