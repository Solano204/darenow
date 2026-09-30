/**
 * FORJA · articulo (un tip)
 *
 * Aprender es la voz de la marca por escrito: aqui manda la lectura. Mismos datos, mismos
 * relacionados y mismas acciones que antes del rediseno (ver `docs/FUNCIONALIDAD.md`, seccion 20);
 * cambia como se lee: una columna comoda, una linea de progreso y una marca de fin.
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ParamListBase } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { paleta, familia, MARGEN_PANTALLA } from '@/ui/theme';
import { fuente } from '@/media/registry';
import { TIPS } from '@/data/catalog';
import { useEstado } from '@/state/store';
import { textoVisible } from '@/lib/presentacion';
import {
  RUTA_DE_RELACIONADO, iconoDeSala, nombreDeSala, relacionadosVista, textoDeLectura, tiempoDeLectura,
} from '@/lib/aprender';
import { GomaTexture } from '@/ui/fx/GomaTexture';
import { BloqueRevela } from '@/ui/fx/BloqueRevela';
import { TituloMascara } from '@/ui/fx/TituloMascara';
import { BarraSuperiorColapsable } from '@/ui/components/BarraSuperiorColapsable';
import { HeroRutina } from '@/ui/components/HeroRutina';
import { LineaDeEtiquetas } from '@/ui/components/EtiquetasMusculo';
import { CuerpoLectura } from '@/features/aprender/components/CuerpoLectura';
import { BarraProgresoLectura } from '@/features/aprender/components/BarraProgresoLectura';
import { MarcaFin } from '@/features/aprender/components/MarcaFin';
import { BloqueRelacionado } from '@/features/aprender/components/TarjetaRelacionada';

const FRACCION_HERO = 0.38;
const ALTO_BARRA_SUPERIOR = 52;
const SEPARACION_SECCIONES = 40;
const ESPERA_TITULO_MS = 150;

type Props = NativeStackScreenProps<ParamListBase, 'Tip'>;

export default function DetalleTip({ route, navigation }: Props) {
  const inset = useSafeAreaInsets();
  const { height: ventana } = useWindowDimensions();
  const y = useSharedValue(0);
  const inicioCuerpo = useSharedValue(0);
  const altoCuerpo = useSharedValue(0);
  const contenido = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(e => { y.value = e.contentOffset.y; });
  const { alternarFavorito, esFavorito, marcarTipLeido } = useEstado();

  const t = TIPS.find(x => x.id === (route.params as { id: string }).id);
  const relacionados = useMemo(() => relacionadosVista(t?.relacionado ?? []), [t]);
  useEffect(() => { if (t) marcarTipLeido(t.id); }, [t?.id]);
  if (!t) return null;

  const foto = fuente('tip', t.id);
  const barraAlto = inset.top + ALTO_BARRA_SUPERIOR;
  const alturaHero = foto !== null ? Math.round(ventana * FRACCION_HERO) : barraAlto + 16;
  const titulo = textoVisible(t.titulo);

  return (
    <View style={s.raiz}>
      <GomaTexture />
      <Animated.ScrollView
        onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false}
        onContentSizeChange={(_, alto) => { contenido.value = alto; }}
        contentContainerStyle={{ paddingBottom: inset.bottom + SEPARACION_SECCIONES }}
      >
        {foto !== null ? <HeroRutina fuente={foto} y={y} alto={alturaHero} /> : <View style={{ height: alturaHero }} />}

        <View style={s.cabecera}>
          <View style={s.categoria}>
            <Ionicons name={iconoDeSala(t.sala)} size={14} color={paleta.magnesia2} />
            <Text style={s.categoriaTexto} maxFontSizeMultiplier={1.3}>{nombreDeSala(t.sala)}</Text>
          </View>
          <View style={s.titulo}>
            <TituloMascara texto={titulo} estilo={s.tituloTexto} activo retraso={ESPERA_TITULO_MS} />
          </View>
          <View style={s.lectura} accessible accessibilityLabel={`${tiempoDeLectura(t.cuerpo)} minuto${tiempoDeLectura(t.cuerpo) === 1 ? '' : 's'} de lectura`}>
            <View style={s.regla} />
            <Text style={s.lecturaTexto} maxFontSizeMultiplier={1.3} importantForAccessibility="no-hide-descendants">
              {tiempoDeLectura(t.cuerpo)} min de lectura
            </Text>
          </View>
        </View>

        <View
          style={s.cuerpo}
          onLayout={e => { inicioCuerpo.value = e.nativeEvent.layout.y; altoCuerpo.value = e.nativeEvent.layout.height; }}
        >
          <CuerpoLectura texto={textoDeLectura(t.cuerpo)} />
        </View>

        <BloqueRevela y={y} sinMovimiento estilo={s.fin}>
          {activo => <MarcaFin activo={activo} />}
        </BloqueRevela>

        {relacionados.length > 0 && (
          <View style={s.seccion}>
            <BloqueRelacionado
              relacionados={relacionados}
              onAbrir={r => navigation.navigate(RUTA_DE_RELACIONADO[r.tipo], { id: r.id })}
            />
          </View>
        )}

        {t.tags.length > 0 && (
          <View style={s.etiquetas}><LineaDeEtiquetas etiquetas={t.tags} /></View>
        )}
      </Animated.ScrollView>

      <BarraSuperiorColapsable
        y={y} alturaHero={alturaHero} nombre={titulo}
        favorito={esFavorito('tips', t.id)} onFavorito={() => alternarFavorito('tips', t.id)}
        onAtras={() => navigation.goBack()}
      >
        <BarraProgresoLectura y={y} inicio={inicioCuerpo} alto={altoCuerpo} contenido={contenido} barraAlto={barraAlto} />
      </BarraSuperiorColapsable>
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: paleta.goma },
  cabecera: { marginHorizontal: MARGEN_PANTALLA, marginTop: 24 },
  categoria: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoriaTexto: { fontFamily: familia.medio, fontSize: 14, lineHeight: 20, color: paleta.magnesia2 },
  titulo: { marginTop: 8 },
  tituloTexto: { fontFamily: familia.display, fontSize: 34, lineHeight: 36, color: paleta.magnesia },
  lectura: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  regla: { width: 24, height: 1, backgroundColor: paleta.gomaBorde },
  lecturaTexto: { fontFamily: familia.cuerpo, fontSize: 13, lineHeight: 18, color: paleta.magnesia3Texto },
  cuerpo: { marginHorizontal: MARGEN_PANTALLA, marginTop: 24 },
  fin: { marginTop: 32 },
  seccion: { marginTop: 32 },
  etiquetas: { marginHorizontal: MARGEN_PANTALLA, marginTop: 24 },
});
