import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CLAVE_CUENTA, CLAVE_ESTADO, CLAVE_HAPTICS } from '@/storage/claves';
import { leerAlArrancar } from '@/storage/lecturaInicial';

describe('lectura inicial con multiGet', () => {
  beforeAll(async () => {
    await AsyncStorage.setItem(CLAVE_ESTADO, '{"perfil":{"nombre":"A"}}');
    await AsyncStorage.setItem(CLAVE_HAPTICS, '0');
  });

  it('un solo multiGet para las tres claves, mismos textos que getItem', async () => {
    const multi = jest.spyOn(AsyncStorage, 'multiGet');
    const get = jest.spyOn(AsyncStorage, 'getItem');
    const [estado, cuenta, hapticos] = await Promise.all([
      leerAlArrancar(CLAVE_ESTADO), leerAlArrancar(CLAVE_CUENTA), leerAlArrancar(CLAVE_HAPTICS),
    ]);
    expect(multi).toHaveBeenCalledTimes(1);
    expect(get).not.toHaveBeenCalled();
    expect(estado).toBe('{"perfil":{"nombre":"A"}}');
    expect(cuenta).toBeNull();
    expect(hapticos).toBe('0');
  });

  it('despues de la primera vez lee directo (nunca un valor viejo)', async () => {
    await AsyncStorage.setItem(CLAVE_HAPTICS, '1');
    expect(await leerAlArrancar(CLAVE_HAPTICS)).toBe('1');
  });
});
