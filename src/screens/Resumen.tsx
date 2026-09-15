import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, tipo, esp, radio, peso } from '../theme';
import { Pantalla, Tarjeta, Fila, Boton, Nota, Aparece, NumeroAnimado } from '../components/ui';
import { useEstado } from '../store/store';
import { useSinAnuncios } from '../components/RelojAnuncios';
import { logroPorId } from '../data/catalog';

/**
 * Resumen.
 *
 * El numero grande es la racha, no las calorias: las calorias son una
 * estimacion poblacional con margen enorme, la racha es un hecho.
 * Si el usuario apago las calorias en Ajustes, aqui no aparecen.
 */

export default function Resumen({ route, navigation }: any) {
  useSinAnuncios();   // el resumen tampoco: es el momento de mas valor
  const { estado: s, items, resultado, completada, kcal } = route.params;
  const { estado: app } = useEstado();
  const [rpe, setRpe] = useState<number | null>(null);

  const minutos = Math.round(s.transcurridoS / 60);
  const reales = s.hechas.filter((h: any) => !h.omitida);
  const omitidas = s.hechas.length - reales.length;
  const ejercicios = new Set(reales.map((h: any) => h.ejercicioId)).size;

  const records = calcularRecords(s.hechas, items);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }}>
      <Pantalla>
        <Text style={[tipo.h1, { color: color.texto, marginTop: esp.md }]}>
          {completada ? 'Sesión completa' : 'Guardamos lo que hiciste'}
        </Text>
        {!completada && (
          <Text style={[tipo.cuerpo, { color: color.textoSuave, marginTop: esp.xs }]}>
            Cuenta igual para tu racha. Lo que hiciste, hecho está.
          </Text>
        )}

        <Aparece><View style={est.destacado}>
          <NumeroAnimado
            valor={resultado.racha.dias}
            estilo={[tipo.reloj, { color: color.acento }]}
            retraso={220}
            maxFontSizeMultiplier={1.2}
          />
          <Text style={[tipo.cuerpo, { color: color.textoSuave }]}>
            {resultado.racha.dias === 1 ? 'día seguido' : 'días seguidos'}
          </Text>
          {resultado.graciaUsada && (
            <Text style={[tipo.pie, { color: color.parcial, marginTop: esp.xs, textAlign: 'center' }]}>
              Usaste un día de gracia. Te queda uno este mes.
            </Text>
          )}
        </View></Aparece>

        <Tarjeta desenfoque>
          <Fila etiqueta="Duración" valor={`${minutos} min`} />
          <Fila etiqueta="Series" valor={String(reales.length)} />
          <Fila etiqueta="Ejercicios" valor={String(ejercicios)} />
          {omitidas > 0 && <Fila etiqueta="Omitidas" valor={String(omitidas)} tenue />}
          {app.perfil.mostrarKcal && kcal != null && kcal > 0 && (
            <Fila etiqueta="Gasto aproximado" valor={`~${kcal} kcal`} tenue />
          )}
        </Tarjeta>

        {records.length > 0 && (
          <Tarjeta desenfoque>
            <Text style={[tipo.dato, { color: color.texto }]}>Mejor que la vez pasada</Text>
            {records.map((r, i) => (
              <Text key={i} style={[tipo.pie, { color: color.textoSuave }]}>{r}</Text>
            ))}
          </Tarjeta>
        )}

        {resultado.logrosNuevos.length > 0 && (
          <Tarjeta desenfoque>
            <Text style={[tipo.dato, { color: color.texto }]}>Nuevo logro</Text>
            {resultado.logrosNuevos.map((id: string) => (
              <View key={id}>
                <Text style={[tipo.cuerpo, { color: color.texto, fontFamily: peso.semibold }]}>
                  {logroPorId.get(id)?.name ?? id}
                </Text>
                <Text style={[tipo.pie, { color: color.textoSuave }]}>
                  {logroPorId.get(id)?.desc}
                </Text>
              </View>
            ))}
          </Tarjeta>
        )}

        <Text style={[tipo.h3, { color: color.texto, marginTop: esp.lg }]}>Cómo se sintió</Text>
        <View style={est.rpe}>
          {[[3, 'Suave'], [5, 'Bien'], [7, 'Exigente'], [9, 'Al límite']].map(([v, t]) => (
            <Pressable
              key={String(v)}
              onPress={() => setRpe(v as number)}
              style={[est.rpeOp, rpe === v && { borderColor: color.carbon, backgroundColor: color.acentoTinte }]}
            >
              <Text style={[tipo.pie, { color: rpe === v ? color.carbon : color.textoSuave, fontFamily: rpe === v ? peso.semibold : peso.regular }]}>
                {t as string}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={[tipo.pie, { color: color.textoTenue, marginTop: esp.xs }]}>
          Con esto ajustamos la carga de la próxima.
        </Text>

        <Boton
          texto="Cerrar"
          onPress={() => navigation.navigate('Tabs', { screen: 'Hoy' })}
          estilo={{ marginTop: esp.xl }}
        />
      </Pantalla>
    </SafeAreaView>
  );
}

function calcularRecords(hechas: any[], items: any[]): string[] {
  const porId = new Map(items.map((i: any) => [i.id, i]));
  const out: string[] = [];
  for (const h of hechas) {
    if (h.omitida) continue;
    const it: any = porId.get(h.ejercicioId);
    if (!it?.ultimaVez) continue;
    if (h.reps != null && it.ultimaVez.reps != null && h.reps > it.ultimaVez.reps)
      out.push(`${it.name}: ${h.reps} reps, antes ${it.ultimaVez.reps}`);
    if (h.segundos != null && it.ultimaVez.segundos != null && h.segundos > it.ultimaVez.segundos)
      out.push(`${it.name}: ${h.segundos} s, antes ${it.ultimaVez.segundos} s`);
    if (h.pesoKg != null && it.ultimaVez.pesoKg != null && h.pesoKg > it.ultimaVez.pesoKg)
      out.push(`${it.name}: ${h.pesoKg} kg, antes ${it.ultimaVez.pesoKg} kg`);
  }
  return [...new Set(out)];
}

const est = StyleSheet.create({
  destacado: { alignItems: 'center', paddingVertical: esp.lg },
  rpe: { flexDirection: 'row', gap: esp.sm, marginTop: esp.sm },
  rpeOp: {
    flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: color.borde, borderRadius: radio.tarjeta,
  },
});
