/**
 * R6 · limitador de haptica: nunca mas de una vibracion cada 40 ms, pase por donde pase.
 */
import { describe, expect, it, jest } from '@jest/globals';
import { haptico } from '@/ui/theme/haptics';

// jest.mock sube sobre los import: el arreglo lleva el prefijo `mock` para poder usarse dentro.
const mockImpactos: string[] = [];
jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Rigid: 'rigid', Heavy: 'heavy', Soft: 'soft' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
  impactAsync: (e: string) => { mockImpactos.push(e); return Promise.resolve(); },
  notificationAsync: (e: string) => { mockImpactos.push(e); return Promise.resolve(); },
  selectionAsync: () => { mockImpactos.push('seleccion'); return Promise.resolve(); },
}));

describe('haptica', () => {
  it('dos golpes en menos de 40 ms suenan como uno; despues vuelve a sonar', () => {
    let ahora = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => ahora);
    haptico.toque();
    ahora += 10; haptico.placa();
    ahora += 20; haptico.exito();
    expect(mockImpactos).toEqual(['light']);
    ahora += 15; haptico.sello();   // 45 ms despues del primero
    expect(mockImpactos).toEqual(['light', 'rigid']);
  });
});
