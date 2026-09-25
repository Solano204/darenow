/**
 * FORJA · componentes base
 *
 * Punto de entrada unico: todo `import { X } from '../components/ui'` que
 * ya existe en las pantallas sigue funcionando igual. El archivo se separo
 * por familias (movimiento, controles, superficies, datos) para que
 * ninguno pase de unas pocas centenas de lineas; la API publica es
 * exactamente la misma que cuando todo vivia en un solo `ui.tsx`.
 */

export * from './movimiento';
export * from './controles';
export * from './superficies';
export * from './datos';
export * from './cabecera';
