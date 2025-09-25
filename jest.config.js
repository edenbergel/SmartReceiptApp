const expoPreset = require('jest-expo/jest-preset');

module.exports = {
  ...expoPreset,
  testMatch: ['**/__tests__/**/*.test.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/server/node_modules/'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-navigation/.*|expo(nent)?|@expo(nent)?/.*|expo-.*|@expo/.*|@unimodules/.*|unimodules/.*|sentry-expo|native-base|immer|@reduxjs/toolkit)'
  ],
  setupFiles: ['<rootDir>/jest.setup.ts', ...(expoPreset.setupFiles || [])],
  watchman: false,
};
