/**
 * R6 · nivel de calidad visual: umbrales de hardware, ahorro de bateria y reducir movimiento.
 */
import { describe, expect, it, jest } from '@jest/globals';
import { bajar, calidadDelTelefono, fraccionAplauso, particulasAmbiente } from '@/ui/fx/useCalidadVisual';

jest.mock('expo-battery', () => ({ useLowPowerMode: () => false }));
jest.mock('expo-device', () => ({ totalMemory: null, deviceYearClass: null }));

const GB = 1024 ** 3;

describe('calidad visual', () => {
  it('umbrales de hardware (DESIGN.md)', () => {
    expect(calidadDelTelefono(2 * GB, 2022)).toBe('baja');     // poca memoria
    expect(calidadDelTelefono(8 * GB, 2015)).toBe('baja');     // telefono viejo
    expect(calidadDelTelefono(4 * GB, 2021)).toBe('media');
    expect(calidadDelTelefono(8 * GB, 2018)).toBe('media');
    expect(calidadDelTelefono(8 * GB, 2021)).toBe('alta');
    expect(calidadDelTelefono(null, null)).toBe('alta');       // sin datos no se castiga
  });

  it('ahorro de bateria y reducir movimiento bajan un nivel cada uno', () => {
    expect(bajar('alta', 1)).toBe('media');
    expect(bajar('alta', 2)).toBe('baja');
    expect(bajar('media', 3)).toBe('baja');
  });

  it('cuanto se dibuja en cada nivel', () => {
    expect(particulasAmbiente(25, 'alta')).toBe(25);
    expect(particulasAmbiente(25, 'media')).toBe(15);
    expect(particulasAmbiente(25, 'baja')).toBe(0);
    expect(fraccionAplauso('baja')).toBe(0.4);
    expect(fraccionAplauso('alta')).toBe(1);
  });
});
