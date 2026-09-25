import { Easing } from 'react-native-reanimated';

export const resortePlaca = { damping: 15, stiffness: 190, mass: 1.2 };
export const resorteMagnesia = { damping: 22, stiffness: 120, mass: 0.8 };
export const resorteTap = { damping: 18, stiffness: 400 };

export const dur = { rapido: 140, medio: 260, lento: 480 };

export const easing = {
  salida: Easing.bezier(0.16, 1, 0.3, 1),
  entrada: Easing.bezier(0.7, 0, 0.84, 0),
};

/** Duraciones de las animaciones que ya usaban `Animated` del core. */
export const anim = { rapida: 160, normal: 260, lenta: 420, muyLenta: 1100 };
