/**
 * Android: las 6 fuentes van incrustadas en el APK con el plugin de expo-font (app.json) y React
 * Native las encuentra por nombre de archivo en assets/fonts (`Figtree_400Regular.ttf` →
 * fontFamily 'Figtree_400Regular', los mismos nombres de `familia`). No hay nada que cargar al
 * arrancar. iOS: ver fuentes.ts.
 */
export function useFuentes(): [cargadas: boolean, error: Error | null] {
  return [true, null];
}
