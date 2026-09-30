import React from 'react';
import type { ParamListBase } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { faseVisual } from '@/ui/theme';
import { useEstado } from '@/store/store';
import { useSinAnuncios } from '@/ui/components/RelojAnuncios';
import { logroPorId } from '@/data/catalog';
import { nombreVisible } from '@/data/nombresVisibles';
import type { EstadoPlayer, SerieHecha } from '@/session/playerMachine';
import type { ItemSesion } from '@/engine/session';
import { ResumenSesion } from '@/components/session/ResumenSesion';

/**
 * Resumen.
 *
 * El numero grande es la racha, no las calorias: las calorias son una
 * estimacion poblacional con margen enorme, la racha es un hecho.
 * Si el usuario apago las calorias en Ajustes, aqui no aparecen.
 *
 * Aqui solo se calculan los datos (los mismos de siempre); lo que se ve esta en
 * `components/session/ResumenSesion`.
 */

interface ParamsResumen {
  estado: EstadoPlayer;
  items: ItemSesion[];
  resultado: { racha: { dias: number }; logrosNuevos: string[]; graciaUsada: boolean };
  completada: boolean;
  kcal: number | null;
}

export default function Resumen({ route, navigation }: NativeStackScreenProps<ParamListBase, 'Resumen'>) {
  useSinAnuncios();   // el resumen tampoco: es el momento de mas valor
  const { estado: s, items, resultado, completada, kcal } = route.params as ParamsResumen;
  const { estado: app } = useEstado();

  const reales = s.hechas.filter(h => !h.omitida);
  const ejercicios = new Set(reales.map(h => h.ejercicioId)).size;

  return (
    <ResumenSesion
      completada={completada}
      dias={resultado.racha.dias}
      graciaUsada={resultado.graciaUsada}
      minutos={Math.round(s.transcurridoS / 60)}
      series={reales.length}
      ejercicios={ejercicios}
      omitidas={s.hechas.length - reales.length}
      kcal={app.perfil.mostrarKcal && kcal != null && kcal > 0 ? kcal : null}
      records={calcularRecords(s.hechas, items)}
      logros={resultado.logrosNuevos.map(id => {
        const l = logroPorId.get(id);
        return { id, nombre: l?.name ?? id, desc: l?.desc, icono: l?.icono ?? '' };
      })}
      faseFinal={faseVisual(s.fase, s.faseAnterior)}
      onCerrar={() => navigation.navigate('Tabs', { screen: 'Hoy' })}
    />
  );
}

function calcularRecords(hechas: SerieHecha[], items: ItemSesion[]): string[] {
  const porId = new Map(items.map(i => [i.id, i]));
  const out: string[] = [];
  for (const h of hechas) {
    if (h.omitida) continue;
    const it = porId.get(h.ejercicioId);
    if (!it?.ultimaVez) continue;
    const nombre = nombreVisible(it.name);
    if (h.reps != null && it.ultimaVez.reps != null && h.reps > it.ultimaVez.reps)
      out.push(`${nombre}: ${h.reps} reps, antes ${it.ultimaVez.reps}`);
    if (h.segundos != null && it.ultimaVez.segundos != null && h.segundos > it.ultimaVez.segundos)
      out.push(`${nombre}: ${h.segundos} s, antes ${it.ultimaVez.segundos} s`);
    if (h.pesoKg != null && it.ultimaVez.pesoKg != null && h.pesoKg > it.ultimaVez.pesoKg)
      out.push(`${nombre}: ${h.pesoKg} kg, antes ${it.ultimaVez.pesoKg} kg`);
  }
  return [...new Set(out)];
}
