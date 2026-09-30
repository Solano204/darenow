/**
 * Pruebas unitarias con Jest (jest-expo). Solo corren las de `tests/unit`: las demas
 * pruebas de `tests/` son scripts propios que se empaquetan con esbuild (`npm run test:*`).
 */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/tests/unit/renders/contador.ts'],
  // worklets/reanimated: resolver sin los .native para que carguen sus versiones de prueba
  resolver: 'react-native-worklets/jest/resolver.js',
  testMatch: ['<rootDir>/tests/unit/**/*.test.ts?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@react-native-async-storage/async-storage$': '@react-native-async-storage/async-storage/jest/async-storage-mock',
  },
};
