/**
 * Las piezas de Explorar que dependen de los filtros (R4). Cada una se suscribe solo a lo suyo
 * en `useFiltrosExplorar`: al tocar un chip se re-renderizan ese chip, el que estaba activo, el
 * contador y la lista; el encabezado, el buscador y el resto de los chips no.
 */
import React from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { CATEGORIAS, GOALS } from '@/data/catalog';
import { BuscadorVivo } from '@/ui/components/BuscadorVivo';
import { ChipCategoria } from '@/ui/components/ChipCategoria';
import { ChipFiltro } from '@/ui/components/ChipFiltro';
import { ICONOS_OBJETIVO } from '@/ui/components/iconosObjetivo';
import { MuroCategoria } from '@/ui/components/Anuncio';
import type { SegmentoExplorar } from '@/ui/components/EncabezadoExplorar';
import { InterruptorDos } from './InterruptorDos';
import { ContadorResultados } from './ContadorResultados';
import { useFiltrosExplorar, filtros, useResultadosExplorar } from '@/features/explorar/hooks/filtrosExplorar';

const TEXTOS_INTERRUPTOR = ['Puedo hacer', 'Catálogo'] as const;
const ETIQUETAS_INTERRUPTOR = ['Lo que puedo hacer', 'Catálogo completo'] as const;
const CATEGORIAS_CON_TODO: readonly { id: string | null; nombre: string }[] = [{ id: null, nombre: 'Todo' }, ...CATEGORIAS];
const UNIDADES: Record<SegmentoExplorar, [singular: string, plural: string]> = {
  ejercicios: ['ejercicio', 'ejercicios'], rutinas: ['rutina', 'rutinas'],
  programas: ['programa', 'programas'], musculos: ['músculo', 'músculos'],
};

/** El buscador: el texto se guarda al instante en cada tecla (la lista lo sigue diferida). */
export function BuscadorExplorar({ foco }: { foco: SharedValue<number> }) {
  const q = useFiltrosExplorar(s => s.q);
  return <BuscadorVivo valor={q} onCambio={filtros.setQ} foco={foco} />;
}

const ChipCategoriaExplorar = React.memo(function ChipCategoriaExplorar({ id, nombre }: { id: string | null; nombre: string }) {
  const activo = useFiltrosExplorar(s => s.cat === id);
  return <ChipCategoria texto={nombre} activo={activo} onPress={() => filtros.setCat(id)} />;
});

/** Todo, Fuerza, Cardio...: cada chip sabe si esta activo. */
export function ChipsCategoria() {
  return <>{CATEGORIAS_CON_TODO.map(c => <ChipCategoriaExplorar key={c.id ?? 'todo'} id={c.id} nombre={c.nombre} />)}</>;
}

const ChipObjetivoExplorar = React.memo(function ChipObjetivoExplorar({ id, texto }: { id: string | null; texto: string }) {
  const activo = useFiltrosExplorar(s => s.goal === id);
  return (
    <ChipFiltro
      texto={texto} icono={id === null ? undefined : ICONOS_OBJETIVO[id]} activo={activo}
      onPress={() => (id === null ? filtros.setGoal(null) : filtros.alternarGoal(id))}
    />
  );
});

/** «Cualquier objetivo» y los 8 objetivos: tocar el activo lo quita. */
export function ChipsObjetivo() {
  return (
    <>
      <ChipObjetivoExplorar id={null} texto="Cualquier objetivo" />
      {GOALS.map(g => <ChipObjetivoExplorar key={g.id} id={g.id} texto={g.nombre} />)}
    </>
  );
}

/** «Lo que puedo hacer» / «Catálogo completo». */
export function InterruptorMios() {
  const soloMios = useFiltrosExplorar(s => s.soloMios);
  return (
    <InterruptorDos
      opciones={TEXTOS_INTERRUPTOR} etiquetas={ETIQUETAS_INTERRUPTOR}
      indice={soloMios ? 0 : 1} onCambio={i => filtros.setSoloMios(i === 0)}
    />
  );
}

/** «30 rutinas»: cuantos resultados hay en el segmento. */
export function ContadorExplorar({ tab, junto, derecha }: {
  tab: SegmentoExplorar; junto?: React.ReactNode; derecha?: React.ReactNode;
}) {
  const cuantos = useResultadosExplorar()[tab].length;
  return <ContadorResultados cuantos={cuantos} singular={UNIDADES[tab][0]} plural={UNIDADES[tab][1]} junto={junto} derecha={derecha} />;
}

/** El muro de desbloqueo del segmento, con cuantos elementos hay detras. */
export function MuroExplorar({ visible, categoria, onVerAnuncio, onVolver, tab }: {
  visible: boolean; categoria: string; onVerAnuncio: () => void; onVolver: () => void; tab: SegmentoExplorar;
}) {
  const cuantos = useResultadosExplorar()[tab].length;
  return <MuroCategoria visible={visible} categoria={categoria} cuantos={cuantos} onVerAnuncio={onVerAnuncio} onVolver={onVolver} />;
}
