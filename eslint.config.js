// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const pluginReactHooks = require('eslint-plugin-react-hooks');
const globals = require('globals');

const FEATURES = [
  'ajustes', 'aprender', 'cuenta', 'ejercicio', 'explorar', 'hoy', 'musculos',
  'onboarding', 'perfil', 'programas', 'rutinas', 'sesion',
];

/**
 * Reglas del React Compiler que trae eslint-plugin-react-hooks 7 (el sucesor de
 * eslint-plugin-react-compiler): mutar props o estado, leer refs en el render, efectos que solo
 * copian estado, impurezas... Desde R4 son error: el compilador esta activo (app.json) y un
 * componente que las rompe se queda sin compilar. Las excepciones van con `'use no memo'` o un
 * eslint-disable de una linea con su motivo (docs/perf/R4_REPORTE.md).
 */
const reglasCompilador = Object.fromEntries(
  Object.keys(pluginReactHooks.configs.recommended.rules)
    .filter(r => r !== 'react-hooks/rules-of-hooks' && r !== 'react-hooks/exhaustive-deps')
    .map(r => [r, 'error']),
);

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'android/*', 'ios/*', 'scripts/**/*.py'],
  },
  {
    rules: {
      ...reglasCompilador,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'no-console': 'warn',
    },
  },
  // Capas (docs/ARQUITECTURA.md): lo compartido no importa de features.
  {
    files: ['src/ui/**', 'src/state/**', 'src/storage/**', 'src/lib/**', 'src/data/**', 'src/media/**', 'src/dev/**'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{ group: ['@/features/*'], message: 'Una capa compartida no importa de una feature (docs/ARQUITECTURA.md).' }],
      }],
    },
  },
  // Una feature no importa los internos de otra.
  ...FEATURES.map(f => ({
    files: [`src/features/${f}/**`],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: FEATURES.filter(x => x !== f).map(x => `@/features/${x}/*`),
          message: 'Una feature no importa de otra: lo compartido va a ui/, lib/, data/ o state/ (docs/ARQUITECTURA.md).',
        }],
      }],
    },
  })),
  // Las pruebas de tests/*.ts son scripts de node que imprimen su resultado.
  {
    files: ['tests/**', 'scripts/**'],
    rules: { 'no-console': 'off' },
  },
  // Los scripts de scripts/*.js corren con node.
  {
    files: ['scripts/**/*.js', '*.config.js', 'babel.config.js'],
    languageOptions: { globals: globals.node },
  },
]);
