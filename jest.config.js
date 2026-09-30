/**
 * Pruebas unitarias con Jest (jest-expo). Solo corren las de `tests/unit`: las demas
 * pruebas de `tests/` son scripts propios que se empaquetan con esbuild (`npm run test:*`).
 *
 * Desde R4 el codigo pasa por el React Compiler igual que en la app (`experiments.reactCompiler`
 * en app.json). `SIN_COMPILADOR=1 npx jest` lo apaga, para comparar renders con y sin el.
 */
const preset = require('jest-expo/jest-preset');

const TS = '\\.[jt]sx?$';
const [babelJest, opciones] = preset.transform[TS];

module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/tests/unit/renders/contador.ts', '<rootDir>/tests/unit/renders/flashlist.ts'],
  // worklets/reanimated: resolver sin los .native para que carguen sus versiones de prueba
  resolver: 'react-native-worklets/jest/resolver.js',
  testMatch: ['<rootDir>/tests/unit/**/*.test.ts?(x)'],
  transform: {
    ...preset.transform,
    [TS]: [babelJest, {
      ...opciones,
      caller: { ...opciones.caller, supportsReactCompiler: process.env.SIN_COMPILADOR !== '1' },
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@react-native-async-storage/async-storage$': '@react-native-async-storage/async-storage/jest/async-storage-mock',
  },
};
