/**
 * Pruebas unitarias con Jest (jest-expo). Solo corren las de `tests/unit`: las demas
 * pruebas de `tests/` son scripts propios que se empaquetan con esbuild (`npm run test:*`).
 */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/tests/unit/**/*.test.ts?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@react-native-async-storage/async-storage$': '@react-native-async-storage/async-storage/jest/async-storage-mock',
  },
};
