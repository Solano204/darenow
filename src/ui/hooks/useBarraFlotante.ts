import { makeMutable } from 'react-native-reanimated';

/** 0 = barra en su sitio, 1 = bajada (se esta bajando por una lista). La escribe el scroll de cada pantalla y la lee `TabBarGoma`. */
export const barraBajada = makeMutable(0);
