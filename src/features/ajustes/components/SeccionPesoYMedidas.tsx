import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { paleta, familia, MARGEN_PANTALLA } from '@/ui/theme';
import type { PerfilUsuario } from '@/state/store';
import { ContadorPlacas } from '@/ui/components/ContadorPlacas';
import { SeccionAjustes } from '@/features/ajustes/components/SeccionAjustes';
import { GrupoFilas } from '@/features/ajustes/components/GrupoFilas';
import { FilaAjuste, BloqueControl, SANGRIA_CON_ICONO } from '@/features/ajustes/components/FilaAjuste';
import { ContadorEstatura } from '@/features/ajustes/components/ContadorEstatura';

const PESO = { min: 30, max: 200, defecto: 70 } as const;
const ESTATURA_DEFECTO = 170;
const ENTRADA_PESO_MS = 240;
const SALIDA_PESO_MS = 160;
const AJUSTE_ALTURA_MS = 240;

/** «Peso y medidas» en Ajustes: el consentimiento y, si se muestran, peso, peso objetivo y estatura. */
export function SeccionPesoYMedidas({
  p, consentimientoMedidas, cambiarConsentimientoMedidas, retirarConsentimientoMedidas, guardarMedida, anima, alMedir,
}: {
  p: PerfilUsuario;
  consentimientoMedidas: boolean;
  cambiarConsentimientoMedidas: (v: boolean) => void;
  retirarConsentimientoMedidas: () => void;
  guardarMedida: (campo: 'pesoKg' | 'pesoObjetivoKg' | 'alturaCm') => (v: number) => void;
  anima: boolean;
  alMedir: (y: number) => void;
}) {
  return (
        <SeccionAjustes titulo="Peso y medidas" alMedir={alMedir}>
          <GrupoFilas sangria={SANGRIA_CON_ICONO}>
            <FilaAjuste
              key="consentimiento" icono="lock-closed-outline" titulo="Guardar peso y medidas"
              descripcion="Peso, altura y mediciones son datos de salud: solo se guardan en este teléfono con tu consentimiento expreso, según el aviso de privacidad."
              interruptor={{
                activo: consentimientoMedidas,
                onCambio: v => (v ? cambiarConsentimientoMedidas(true) : retirarConsentimientoMedidas()),
              }}
            />
          </GrupoFilas>

          {p.mostrarPeso && (
            <Animated.View
              key="peso-opcional"
              entering={anima ? FadeIn.duration(ENTRADA_PESO_MS) : undefined}
              exiting={anima ? FadeOut.duration(SALIDA_PESO_MS) : undefined}
              layout={anima ? LinearTransition.duration(AJUSTE_ALTURA_MS) : undefined}
            >
              <Text style={s.subtitulo} accessibilityRole="header" maxFontSizeMultiplier={1.3}>Peso (opcional)</Text>
              <GrupoFilas>
                <BloqueControl
                  key="ahora" centrado
                  descripcion="Solo se usa para estimar el gasto de la sesión. Sin él, la app funciona igual y no muestra kcal."
                >
                  <ContadorPlacas
                    compacto estilo={s.plano} valor={p.pesoKg ?? PESO.defecto} min={PESO.min} max={PESO.max} sufijo="kg ahora"
                    onCambio={guardarMedida('pesoKg')}
                  />
                </BloqueControl>
                <BloqueControl
                  key="objetivo" centrado
                  descripcion="Peso de referencia. No cambia tu plan: no ponemos dietas, ni fechas, ni objetivos de calorías."
                >
                  <ContadorPlacas
                    compacto estilo={s.plano} valor={p.pesoObjetivoKg ?? p.pesoKg ?? PESO.defecto} min={PESO.min} max={PESO.max}
                    sufijo="kg objetivo" onCambio={guardarMedida('pesoObjetivoKg')}
                  />
                </BloqueControl>
              </GrupoFilas>
            </Animated.View>
          )}

          <Animated.View layout={anima ? LinearTransition.duration(AJUSTE_ALTURA_MS) : undefined}>
            <Text style={s.subtitulo} accessibilityRole="header" maxFontSizeMultiplier={1.3}>Estatura (opcional)</Text>
            <GrupoFilas>
              <BloqueControl centrado descripcion="Dato de tu perfil. No se usa en ningún cálculo del plan.">
                <ContadorEstatura valor={p.alturaCm ?? ESTATURA_DEFECTO} onCambio={guardarMedida('alturaCm')} />
              </BloqueControl>
            </GrupoFilas>
          </Animated.View>
        </SeccionAjustes>
  );
}

const s = StyleSheet.create({
  plano: { flex: 0 },
  subtitulo: {
    marginHorizontal: MARGEN_PANTALLA, marginTop: 24, marginBottom: 12,
    fontFamily: familia.enfasis, fontSize: 16, lineHeight: 22, color: paleta.magnesia,
  },
});
