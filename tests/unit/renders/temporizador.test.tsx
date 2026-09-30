/**
 * R4 · prueba de precisión del temporizador (3.8). Cinco minutos de sesión con pausa, reanudar,
 * omitir, «Listo», salir a segundo plano y volver; cada segundo se anota lo que muestra el
 * reproductor (fase, ejercicio, serie, lado, segundos, transcurrido, series hechas y el número
 * en pantalla). La línea de tiempo tiene que ser idéntica a la del reproductor de antes de R4
 * (tests/unit/fixtures/temporizador-antes.json, grabada con ese código y esta misma prueba).
 *
 * `TIMELINE_SALIDA=archivo.json` guarda la línea de tiempo (así se grabó la de antes).
 */
import { playersVideo } from './mocks';
import fs from 'fs';
import path from 'path';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { act, type ReactTestRenderer } from 'react-test-renderer';
import { AppState } from 'react-native';
import * as Speech from 'expo-speech';
import * as sonido from '@/media/sonido';
import * as voz from '@/media/voz';
import { haptico } from '@/ui/theme';
import { montar, esperar, usarRelojFalso } from './montar';
import Reproductor from '@/features/sesion/screens/Reproductor';
import { RUTINAS } from '@/data/catalog';
import { sesionDeRutina } from '@/lib/engine/session';
import { PERFIL_INICIAL } from '@/state/estadoInicial';

interface Linea {
  s: number; fase: string; indice: number; serie: number; lado: string | null;
  restante: number; transcurrido: number; hechas: number; numero: number | string | null;
  /** Lo que sonó, vibró o se dijo en ese segundo, en orden. */
  eventos: string[];
}

let vivo: ReactTestRenderer | null = null;
afterEach(async () => {
  if (vivo) { const r = vivo; await act(async () => { r.unmount(); }); vivo = null; }
  usarRelojFalso(false);
  jest.restoreAllMocks();
});

describe('temporizador del reproductor', () => {
  it('5 minutos con pausa, omitir, Listo y segundo plano: igual que antes', async () => {
    const oyentes: ((s: string) => void)[] = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((_t: string, h: (s: string) => void) => {
      oyentes.push(h);
      return { remove: () => { oyentes.splice(oyentes.indexOf(h), 1); } };
    }) as never);
    const emitir = async (s: string) => { await act(async () => { [...oyentes].forEach(h => h(s)); }); };

    // Todo lo que suena, vibra o se dice, anotado en el segundo en que pasa.
    let eventos: string[] = [];
    jest.spyOn(sonido, 'reproducir').mockImplementation((n: string) => { eventos.push(`sonido:${n}`); });
    for (const k of Object.keys(haptico) as (keyof typeof haptico)[]) {
      jest.spyOn(haptico, k).mockImplementation((() => { eventos.push(`haptico:${String(k)}`); }) as never);
    }
    const fuenteVoz = voz.fuenteVoz;
    jest.spyOn(voz, 'fuenteVoz').mockImplementation(((t: never, id: string) => { eventos.push(`voz:${t}:${id}`); return fuenteVoz(t, id); }) as never);
    const hablar = Speech.speak;
    jest.spyOn(Speech, 'speak').mockImplementation(((t: string, o: never) => { eventos.push(`voz:${t}`); hablar(t, o); }) as never);

    usarRelojFalso(true);
    jest.setSystemTime(new Date('2026-09-30T10:00:00Z'));
    const rutina = RUTINAS.find(r => r.id === 'rt_001')!;
    const sesion = { ...sesionDeRutina(rutina.id, { ...PERFIL_INICIAL } as never, rutina), origenPropia: true };
    vivo = await montar(Reproductor as never, { sesion });

    // La pantalla «Listo» (3 s) y el montaje del reproductor.
    const layout = () => vivo!.root.findAll(n => typeof n.props.onPausa === 'function' && Array.isArray(n.props.items))[0];
    for (let k = 0; k < 10 && !layout(); k++) await esperar(500);
    expect(layout()).toBeTruthy();

    const estado = () => {
      const p = layout().props;
      return p.tienda ? p.tienda.getState().estado : p.estado; // R4 : antes
    };
    const numero = () => {
      const n = vivo!.root.findAll(x => typeof x.props.tamano === 'number' && 'golpe' in x.props && 'segundos' in x.props)[0];
      return n ? (n.props.fijo ?? n.props.segundos) : null;
    };
    const tocar = async (nombre: string) => { await act(async () => { layout().props[nombre](); }); };

    const linea: Linea[] = [];
    eventos = [];
    // Politica de clips (R5): cada segundo, como mucho 1 reproduciendo y 2 vivos (el del
    // ejercicio en pantalla y el que se deja preparado en el descanso).
    let maxVivos = 0;
    let maxReproduciendo = 0;
    let conPreparado = false;
    for (let s = 1; s <= 300; s++) {
      await esperar(1000);
      if (s === 20) await tocar('onPausa');
      if (s === 35) await tocar('onReanudar');
      if (s === 60) await tocar('onOmitir');
      if (s === 90 || s === 150 || s === 230) {
        const e = estado();
        const p = layout().props;
        if (e.fase === 'trabajo' && !p.esPorTiempo) await tocar('onListo');
        else if (e.fase === 'trabajo' || e.fase === 'descanso') await tocar('onAvanzar');
      }
      if (s === 120) await emitir('background');
      if (s === 140) await emitir('active');
      if (s === 200) await tocar('onPausa');
      if (s === 205) await tocar('onReanudar');
      const vivos = playersVideo();
      maxVivos = Math.max(maxVivos, vivos.length);
      maxReproduciendo = Math.max(maxReproduciendo, vivos.filter(v => v.playing).length);
      if (estado().fase === 'descanso' && vivos.length === 1 && !vivos[0].playing) conPreparado = true;
      const e = estado();
      linea.push({
        s, fase: e.fase, indice: e.indice, serie: e.serieNum, lado: e.lado, restante: e.restanteS,
        transcurrido: e.transcurridoS, hechas: e.hechas.length, numero: numero(), eventos,
      });
      eventos = [];
    }

    const salida = process.env.TIMELINE_SALIDA;
    if (salida) fs.writeFileSync(salida, JSON.stringify(linea) + '\n');

    // Sanidad: la sesión avanzó, pausó y pasó por varias fases.
    expect(new Set(linea.map(l => l.fase)).size).toBeGreaterThanOrEqual(3);
    expect(linea.some(l => l.fase === 'pausa')).toBe(true);
    expect(linea[linea.length - 1].transcurrido).toBeGreaterThan(150);
    expect(linea.flatMap(l => l.eventos).some(x => x.startsWith('sonido:cuenta_'))).toBe(true);
    expect(linea.flatMap(l => l.eventos).some(x => x.startsWith('voz:'))).toBe(true);

    // (En Jest el modelo no mide su alto y no monta el clip: aqui solo se ve el preparado.)
    expect(maxReproduciendo).toBeLessThanOrEqual(1);
    expect(maxVivos).toBeLessThanOrEqual(2);
    expect(conPreparado).toBe(true);

    const antes = JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures/temporizador-antes.json'), 'utf8'));
    expect(linea).toEqual(antes);
  }, 120000);
});
