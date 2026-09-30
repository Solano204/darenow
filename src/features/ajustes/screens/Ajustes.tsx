/**
 * FORJA · ajustes
 *
 * Los mismos ajustes, con los mismos limites, el mismo guardado (todo al instante) y las mismas confirmaciones de
 * siempre (ver `docs/FUNCIONALIDAD.md`, seccion 23); cambia como se ven: un indice de secciones pegajoso, listas
 * agrupadas en lugar de una tarjeta por fila, los controles del cuestionario donde se elegian y las acciones que
 * borran como filas rojas con su confirmacion en una hoja inferior.
 */

import { Linking, StyleSheet, Text, View } from 'react-native';
import { paleta, familia, MARGEN_PANTALLA } from '@/ui/theme';
import { URL_PRIVACIDAD, URL_TERMINOS, URL_BORRAR_CUENTA } from '@/lib/legal';
import { porId } from '@/data/catalog';
import { textoVisible } from '@/lib/presentacion';
import { ESPACIOS, ETIQUETAS_ESPACIO, LESIONES, indiceDeEspacio } from '@/features/ajustes/utils/ajustes';
import { PantallaColapsable } from '@/ui/components/PantallaColapsable';
import { NotaEntrenador, estiloNota } from '@/ui/components/NotaEntrenador';
import { IconoTrazo } from '@/ui/fx/IconoTrazo';
import { TarjetaLoQueSuelePasar } from '@/ui/components/TarjetaLoQueSuelePasar';
import { ChipCategoria } from '@/ui/components/ChipCategoria';
import { IndiceSecciones, ALTO_INDICE } from '@/features/ajustes/components/IndiceSecciones';
import { SeccionAjustes, ContadorDe, ContadorMarcadas } from '@/features/ajustes/components/SeccionAjustes';
import { GrupoFilas } from '@/features/ajustes/components/GrupoFilas';
import { FilaAjuste, BloqueControl, SANGRIA_CON_ICONO } from '@/features/ajustes/components/FilaAjuste';
import { SegmentadoTres } from '@/features/ajustes/components/SegmentadoTres';
import { FilaEquipo } from '@/features/ajustes/components/FilaEquipo';
import { FilaLesion } from '@/features/ajustes/components/FilaLesion';
import { RejillaCatalogo } from '@/features/ajustes/components/RejillaCatalogo';
import { FilaCuenta } from '@/features/ajustes/components/FilaCuenta';
import { FilaDestructiva } from '@/features/ajustes/components/FilaDestructiva';
import { HojaConfirmacion } from '@/features/ajustes/components/HojaConfirmacion';
import { SeccionTuPlan } from '@/features/ajustes/components/SeccionTuPlan';
import { SeccionPesoYMedidas } from '@/features/ajustes/components/SeccionPesoYMedidas';
import { useAjustes, INDICE } from '@/features/ajustes/hooks/useAjustes';
import type { SharedValue } from 'react-native-reanimated';
import type { ParamListBase } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

const SEC = {
  plan: 0, donde: 1, equipo: 2, lesiones: 3, sesion: 4, ver: 5, medidas: 6, catalogo: 7, cuenta: 8, datos: 9, legal: 10,
} as const;


export default function Ajustes({ navigation }: NativeStackScreenProps<ParamListBase, 'Ajustes'>) {
  const a = useAjustes();
  const { hoja, setHoja, arriba } = a;
  return (
    <>
      <PantallaColapsable
        titulo="Ajustes" onAtras={() => navigation.goBack()}
        superposicion={({ y, desplazarA, altoBarra, relleno }) => (
          <IndiceSecciones nombres={INDICE} arriba={arriba} y={y} desplazarA={desplazarA} altoBarra={altoBarra} relleno={relleno} />
        )}
        contenido={({ y }) => <CuerpoAjustes a={a} y={y} />}
      />
      <HojaConfirmacion
        visible={hoja !== null} onCerrar={() => setHoja(null)}
        titulo={hoja?.titulo ?? ''} texto={hoja?.texto ?? ''} acciones={hoja?.acciones ?? []}
      />
    </>
  );
}

/**
 * Las secciones de Ajustes. Es su propio componente (y no el `contenido` de `PantallaColapsable` escrito
 * en linea) para que el React Compiler memorice cada fila: al cambiar un ajuste solo se vuelven a
 * dibujar las filas que dependen de el (R4).
 */
function CuerpoAjustes({ a, y }: { a: ReturnType<typeof useAjustes>; y: SharedValue<number> }) {
  const {
    guardarPerfil, cuenta, p, objetivoAbierto, setObjetivoAbierto, hapticosOn, vozOn, setVozOn,
    consentimientoMedidas, cambiarConsentimientoMedidas, exportando, importando,
    arriba, medir, equipoOnb, equipoMarcado, lesionesMarcadas, anima, retirarConsentimientoMedidas,
    exportar, confirmarBorrarTodo, confirmarCerrarSesion, importar, guardarMedida, cambiarVibracion,
    alternarEquipo, alternarLesion,
  } = a;
  return (
    <>
      <View style={{ height: ALTO_INDICE }} />

      <SeccionTuPlan
        p={p} guardarPerfil={guardarPerfil} objetivoAbierto={objetivoAbierto} setObjetivoAbierto={setObjetivoAbierto}
        anima={anima} alMedir={medir(SEC.plan)}
      />

      <SeccionAjustes titulo="Dónde entrenas" alMedir={medir(SEC.donde)}>
        <GrupoFilas sangria={SANGRIA_CON_ICONO}>
          <FilaAjuste
            key="sinsaltos" icono="footsteps-outline" titulo="Modo sin saltos"
            descripcion="Quita impacto y ruido. Cada rutina tiene su versión silenciosa."
            interruptor={{ activo: p.modoSinSaltos, onCambio: v => guardarPerfil({ modoSinSaltos: v }) }}
          />
          <BloqueControl key="espacio" titulo="Espacio">
            <SegmentadoTres
              opciones={[ETIQUETAS_ESPACIO.minimo, ETIQUETAS_ESPACIO.colchoneta, ETIQUETAS_ESPACIO.amplio]}
              etiquetas={['Espacio mínimo', 'Espacio colchoneta', 'Espacio amplio']}
              indice={indiceDeEspacio(p.espacio)}
              onCambio={i => guardarPerfil({ espacio: ESPACIOS[i] })}
            />
          </BloqueControl>
        </GrupoFilas>
      </SeccionAjustes>

      <SeccionAjustes
        titulo="Equipo" alMedir={medir(SEC.equipo)}
        derecha={<ContadorDe n={equipoMarcado} de={equipoOnb.length} />}
      >
        <GrupoFilas sangria={SANGRIA_CON_ICONO}>
          {equipoOnb.map(e => (
            <FilaEquipo
              key={e.id} id={e.id} nombre={e.name} sustituto={e.sustituto_casero || undefined}
              marcado={p.equipo.includes(e.id)} onCambiar={() => alternarEquipo(e.id)}
            />
          ))}
        </GrupoFilas>
      </SeccionAjustes>

      <SeccionAjustes
        titulo="Lesiones y condiciones" alMedir={medir(SEC.lesiones)}
        derecha={<ContadorMarcadas n={lesionesMarcadas} />}
      >
        <View style={s.nota}>
          <TarjetaLoQueSuelePasar
            activo animar={false} compacto icono="shield-checkmark-outline" titulo="Filtro de seguridad"
            texto="Este filtro nunca se relaja, aunque la app se quede sin ejercicios para un patrón."
          />
        </View>
        <GrupoFilas>
          {LESIONES.map(([id, texto]) => (
            <FilaLesion key={id} texto={texto} marcada={p.contra.includes(id)} onCambiar={() => alternarLesion(id)} />
          ))}
        </GrupoFilas>
      </SeccionAjustes>

      <SeccionAjustes titulo="Sesión" alMedir={medir(SEC.sesion)}>
        <GrupoFilas sangria={SANGRIA_CON_ICONO}>
          <FilaAjuste
            key="tonos" icono="volume-high-outline" titulo="Tonos durante la sesión"
            descripcion="Tres tonos que suben al final de cada fase, y uno distinto al empezar, al terminar la serie y al acabarse el descanso. Sirve para entrenar sin mirar la pantalla."
            interruptor={{ activo: p.sonido, onCambio: v => guardarPerfil({ sonido: v }) }}
          />
          <FilaAjuste
            key="voz" icono="megaphone-outline" titulo="Voz"
            descripcion="Dice el nombre del ejercicio y sus claves al empezar, la cuenta 3-2-1, y cada cambio de fase. Mientras habla, el botón para avanzar se desactiva un instante."
            interruptor={{ activo: vozOn, onCambio: setVozOn }}
          />
          <FilaAjuste
            key="vibracion" icono="phone-portrait-outline" titulo="Vibración"
            descripcion="Un toque corto al completar una serie, uno largo al terminar la sesión. Útil con música puesta, cuando el sonido no llega."
            interruptor={{ activo: hapticosOn, onCambio: cambiarVibracion }}
          />
        </GrupoFilas>
      </SeccionAjustes>

      <SeccionAjustes titulo="Qué quieres ver" alMedir={medir(SEC.ver)}>
        <GrupoFilas sangria={SANGRIA_CON_ICONO}>
          <FilaAjuste
            key="kcal" icono="calculator-outline" titulo="Estimación de calorías"
            descripcion="Es una estimación poblacional, no una medida de tu cuerpo. Puedes apagarla."
            interruptor={{ activo: p.mostrarKcal, onCambio: v => guardarPerfil({ mostrarKcal: v }) }}
          />
          <FilaAjuste
            key="peso" icono="resize-outline" titulo="Peso y medidas corporales"
            descripcion="Si las apagas, desaparecen de toda la app. El plan funciona igual."
            interruptor={{ activo: p.mostrarPeso, onCambio: v => guardarPerfil({ mostrarPeso: v }) }}
          />
        </GrupoFilas>
      </SeccionAjustes>

      <SeccionPesoYMedidas
        p={p} consentimientoMedidas={consentimientoMedidas} cambiarConsentimientoMedidas={cambiarConsentimientoMedidas}
        retirarConsentimientoMedidas={retirarConsentimientoMedidas} guardarMedida={guardarMedida} anima={anima}
        alMedir={medir(SEC.medidas)}
      />

      {p.vetos.length > 0 && (
        <SeccionAjustes titulo={`Ejercicios vetados (${p.vetos.length})`}>
          <View style={s.chips}>
            {p.vetos.map(id => (
              <ChipCategoria
                key={id} texto={textoVisible(porId.get(id)?.name ?? id)} activo={false}
                onPress={() => guardarPerfil({ vetos: p.vetos.filter(x => x !== id) })}
              />
            ))}
          </View>
          <Text style={s.pie}>Toca uno para volver a permitirlo.</Text>
        </SeccionAjustes>
      )}

      <SeccionAjustes titulo="Catálogo" alMedir={medir(SEC.catalogo)}>
        <RejillaCatalogo y={y} arriba={arriba[SEC.catalogo]} />
      </SeccionAjustes>

      <SeccionAjustes titulo="Tu cuenta" alMedir={medir(SEC.cuenta)}>
        <GrupoFilas sangria={SANGRIA_CON_ICONO}>
          <FilaCuenta
            key="cuenta" google={cuenta?.proveedor === 'google'}
            correo={cuenta?.email ?? cuenta?.nombre ?? 'Invitado'}
          />
          {cuenta?.proveedor === 'google' && (
            <FilaAjuste key="salir" icono="log-out-outline" titulo="Cerrar sesión" onPress={confirmarCerrarSesion} />
          )}
          <FilaDestructiva key="eliminar" titulo="Eliminar mi cuenta" onPress={confirmarBorrarTodo} />
        </GrupoFilas>
      </SeccionAjustes>

      <SeccionAjustes titulo="Tus datos" alMedir={medir(SEC.datos)}>
        <NotaEntrenador colorBarra={paleta.magnesia3} estilo={s.notaDatos}>
          <View style={s.notaFila}>
            <IconoTrazo nombre="telefono" activo animar={false} tamano={22} color={paleta.magnesia2} />
            <Text style={[estiloNota, s.notaTexto]} maxFontSizeMultiplier={1.3}>
              Todo vive en este teléfono, sin copia en la nube. Exporta un archivo para guardarlo tú o pasarlo a otro teléfono.
            </Text>
          </View>
        </NotaEntrenador>
        <GrupoFilas sangria={SANGRIA_CON_ICONO}>
          <FilaAjuste
            key="exportar" icono="arrow-up-circle-outline" titulo="Exportar mi progreso" chevron="derecha"
            ocupada={exportando ? 'Exportando...' : undefined} onPress={exportar}
          />
          <FilaAjuste
            key="importar" icono="arrow-down-circle-outline" titulo="Importar progreso" chevron="derecha"
            ocupada={importando ? 'Leyendo archivo...' : undefined} onPress={importar}
          />
        </GrupoFilas>
      </SeccionAjustes>

      <SeccionAjustes titulo="Legal" alMedir={medir(SEC.legal)}>
        <GrupoFilas sangria={SANGRIA_CON_ICONO}>
          <FilaAjuste
            key="privacidad" icono="document-text-outline" titulo="Aviso de privacidad" chevron="enlace" rol="link"
            onPress={() => { Linking.openURL(URL_PRIVACIDAD); }}
          />
          <FilaAjuste
            key="terminos" icono="document-text-outline" titulo="Términos y condiciones" chevron="enlace" rol="link"
            onPress={() => { Linking.openURL(URL_TERMINOS); }}
          />
          <FilaDestructiva
            key="borrar-web" titulo="Borrar cuenta y datos" enlaceExterno
            onPress={() => { Linking.openURL(URL_BORRAR_CUENTA); }}
          />
        </GrupoFilas>
      </SeccionAjustes>

      <View style={s.cierre}>
        <GrupoFilas sangria={SANGRIA_CON_ICONO}>
          <FilaDestructiva titulo="Borrar todos mis datos" onPress={confirmarBorrarTodo} />
        </GrupoFilas>
        <Text style={s.aviso}>
          Contenido educativo y de entrenamiento. No sustituye diagnóstico ni consejo médico, fisioterapéutico o nutricional individual.
        </Text>
        <Text style={s.wordmark} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">DARENOW</Text>
      </View>
    </>
  );
}

const s = StyleSheet.create({
  nota: { marginHorizontal: MARGEN_PANTALLA, marginBottom: 12 },
  notaDatos: { alignSelf: 'stretch', marginHorizontal: MARGEN_PANTALLA, marginBottom: 12 },
  notaFila: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  notaTexto: { flex: 1 },
  chips: { marginHorizontal: MARGEN_PANTALLA, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pie: {
    marginHorizontal: MARGEN_PANTALLA, marginTop: 12, fontFamily: familia.cuerpo, fontSize: 14, lineHeight: 20,
    color: paleta.magnesia3Texto,
  },
  cierre: { marginTop: 40 },
  aviso: {
    marginHorizontal: MARGEN_PANTALLA, marginTop: 16, textAlign: 'center',
    fontFamily: familia.cuerpo, fontSize: 13, lineHeight: 19, color: paleta.magnesia3Texto,
  },
  wordmark: {
    marginTop: 32, textAlign: 'center', fontFamily: familia.titulo, fontSize: 20, lineHeight: 24, letterSpacing: 2,
    color: paleta.gomaBorde,
  },
});
