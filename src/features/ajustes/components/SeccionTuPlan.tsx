import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { paleta } from '@/ui/theme';
import type { PerfilUsuario } from '@/state/store';
import { GOALS, nombreGoal } from '@/data/catalog';
import { ContadorPlacas } from '@/ui/components/ContadorPlacas';
import { ICONOS_OBJETIVO } from '@/ui/components/iconosObjetivo';
import { DialTiempo } from '@/ui/fx/DialTiempo';
import { SeccionAjustes } from '@/features/ajustes/components/SeccionAjustes';
import { GrupoFilas } from '@/features/ajustes/components/GrupoFilas';
import { FilaAjuste, BloqueControl, ChevronGiratorio, SANGRIA_CON_ICONO } from '@/features/ajustes/components/FilaAjuste';
import { SelectorNivel } from '@/features/ajustes/components/SelectorNivel';

const MINUTOS = { min: 5, max: 90 } as const;
const TAMANO_DIAL = 120;
const ENTRADA_OBJETIVOS_MS = 180;
const SALIDA_OBJETIVOS_MS = 120;

/** «Tu plan» en Ajustes: objetivo (desplegable), minutos por sesion, dias por semana y nivel. */
export function SeccionTuPlan({ p, guardarPerfil, objetivoAbierto, setObjetivoAbierto, anima, alMedir }: {
  p: PerfilUsuario;
  guardarPerfil: (cambio: Partial<PerfilUsuario>) => void;
  objetivoAbierto: boolean;
  setObjetivoAbierto: React.Dispatch<React.SetStateAction<boolean>>;
  anima: boolean;
  alMedir: (y: number) => void;
}) {
  return (
        <SeccionAjustes titulo="Tu plan" primera alMedir={alMedir}>
          <GrupoFilas animarAltura sangria={SANGRIA_CON_ICONO}>
            <FilaAjuste
              key="objetivo" icono={ICONOS_OBJETIVO[p.objetivo] ?? 'flag-outline'}
              titulo="Objetivo" valor={nombreGoal(p.objetivo)} valorApilado
              derecha={<ChevronGiratorio abierto={objetivoAbierto} />}
              onPress={() => setObjetivoAbierto(abierto => !abierto)}
              estado={{ expanded: objetivoAbierto }} etiqueta={`Objetivo, ${nombreGoal(p.objetivo)}`}
            />
            {objetivoAbierto && GOALS.map(g => (
              <Animated.View
                key={g.id}
                entering={anima ? FadeIn.duration(ENTRADA_OBJETIVOS_MS) : undefined}
                exiting={anima ? FadeOut.duration(SALIDA_OBJETIVOS_MS) : undefined}
              >
                <FilaAjuste
                  icono={ICONOS_OBJETIVO[g.id] ?? 'flag-outline'} titulo={g.nombre} descripcion={g.sub}
                  derecha={p.objetivo === g.id ? <Ionicons name="checkmark" size={20} color={paleta.magnesia} /> : undefined}
                  rol="radio" estado={{ selected: p.objetivo === g.id }} etiqueta={`${g.nombre}, ${g.sub}`}
                  onPress={() => { guardarPerfil({ objetivo: g.id }); setObjetivoAbierto(false); }}
                />
              </Animated.View>
            ))}
            <BloqueControl key="minutos" titulo="Minutos por sesión" centrado>
              <ContadorPlacas
                compacto estilo={s.plano} valor={p.minPorSesion} min={MINUTOS.min} max={MINUTOS.max} sufijo="minutos"
                onCambio={v => guardarPerfil({ minPorSesion: v })}
                encima={<DialTiempo tamano={TAMANO_DIAL} activo animar={false} medida={{ valor: p.minPorSesion, maximo: MINUTOS.max }} />}
              />
            </BloqueControl>
            <BloqueControl key="dias" titulo="Días por semana" centrado>
              <ContadorPlacas
                semana estilo={s.plano} valor={p.diasPorSemana} min={1} max={7} sufijo="días"
                onCambio={v => guardarPerfil({ diasPorSemana: v })}
              />
            </BloqueControl>
            <BloqueControl key="nivel" titulo="Nivel">
              <SelectorNivel nivel={p.nivel} onCambio={n => guardarPerfil({ nivel: n })} />
            </BloqueControl>
          </GrupoFilas>
        </SeccionAjustes>
  );
}

const s = StyleSheet.create({
  plano: { flex: 0 },
});
