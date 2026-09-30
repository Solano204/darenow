import { useFonts } from 'expo-font';

/**
 * iOS (y cualquier plataforma que no sea Android): las fuentes se registran en tiempo de ejecucion
 * con los nombres de `familia` (typography.ts). En iOS un TTF incrustado se nombra con su nombre
 * PostScript, que no coincide con esos nombres, asi que aqui se siguen cargando con `useFonts`.
 * Se importa cada peso por su archivo: el indice del paquete arrastraria los 23 pesos.
 * Android: ver fuentes.android.ts.
 */
export function useFuentes(): [cargadas: boolean, error: Error | null] {
  return useFonts({
    BigShouldersDisplay_700Bold: require('@expo-google-fonts/big-shoulders-display/BigShouldersDisplay_700Bold.ttf'),
    BigShouldersDisplay_800ExtraBold: require('@expo-google-fonts/big-shoulders-display/BigShouldersDisplay_800ExtraBold.ttf'),
    Figtree_400Regular: require('@expo-google-fonts/figtree/400Regular/Figtree_400Regular.ttf'),
    Figtree_500Medium: require('@expo-google-fonts/figtree/500Medium/Figtree_500Medium.ttf'),
    Figtree_600SemiBold: require('@expo-google-fonts/figtree/600SemiBold/Figtree_600SemiBold.ttf'),
    Figtree_700Bold: require('@expo-google-fonts/figtree/700Bold/Figtree_700Bold.ttf'),
  });
}
