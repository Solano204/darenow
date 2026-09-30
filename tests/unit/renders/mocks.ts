/**
 * Mocks para montar pantallas reales en Jest (solo las pruebas de renders de R4). Skia y los
 * módulos nativos no dibujan nada aquí: interesa qué componentes de React se ejecutan.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
import { jest } from '@jest/globals';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => {
  const m = require('react-native-reanimated/mock');
  // Lo que el mock de reanimated no trae y la app usa.
  const extra = { useReducedMotion: () => false, ReduceMotion: { System: 'system', Always: 'always', Never: 'never' } };
  return { ...m, ...extra, default: { ...m.default, ...extra }, __esModule: true };
});

jest.mock('@shopify/react-native-skia', () => {
  const React = require('react');
  const nulo = () => null;
  const cache: Record<string, unknown> = {};
  const profundo: unknown = new Proxy(function () { return profundo; }, {
    get: (_t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : profundo),
    apply: () => profundo,
  });
  return new Proxy({}, {
    get: (_t, k: string) => {
      if (k === '__esModule') return true;
      if (cache[k]) return cache[k];
      let v: unknown;
      if (k === 'Canvas' || k === 'Group') v = ({ children }: { children?: unknown }) => React.createElement(React.Fragment, null, children);
      else if (/^use[A-Z]/.test(k)) v = () => null;
      else if (/^[A-Z]/.test(k) && k !== 'Skia') v = nulo;
      else v = profundo;
      cache[k] = v;
      return v;
    },
  });
});

jest.mock('expo-video', () => ({
  useVideoPlayer: () => ({ play() {}, pause() {}, release() {}, addListener: () => ({ remove() {} }) }),
  VideoView: () => null,
}));
jest.mock('expo-haptics', () => new Proxy({}, { get: () => () => Promise.resolve() }));
// La voz «termina» al instante, como si la frase durara 0 s.
jest.mock('expo-speech', () => ({
  speak: (_t: string, o?: { onDone?: () => void }) => { setTimeout(() => o?.onDone?.(), 0); },
  stop: () => Promise.resolve(),
  isSpeakingAsync: () => Promise.resolve(false),
}));
jest.mock('expo-audio', () => ({
  createAudioPlayer: () => ({ play() {}, pause() {}, remove() {}, seekTo() {}, replace() {} }),
  setAudioModeAsync: () => Promise.resolve(),
}));
