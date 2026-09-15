# Sonidos

Nueve tonos cortos, 27 KB en total. **Ya están generados** — no hay que
grabar ni buscar nada. Si quieres cambiarlos, edita `gen_sonidos.py` en la
raíz del paquete y vuelve a correrlo.

```
cuenta_3.mp3       0.13 s   ┐
cuenta_2.mp3       0.13 s   ├ tres tins que suben de altura
cuenta_1.mp3       0.13 s   ┘
inicio_serie.mp3   0.42 s   arranca la serie
fin_serie.mp3      0.50 s   acabaste la serie
cambio_lado.mp3    0.30 s   cambia de pierna o de brazo
fin_descanso.mp3   0.40 s   se acabó el descanso
fin_sesion.mp3     0.87 s   terminaste la sesión
toque.mp3          0.04 s   click de botón (opcional)
```

## Cuándo suena cada uno

| Momento | Sonido |
|---|---|
| `preparado`, últimos 3 s | cuenta_3 · cuenta_2 · cuenta_1 |
| entra en `trabajo` | inicio_serie |
| `trabajo` por tiempo, últimos 3 s | cuenta_3 · cuenta_2 · cuenta_1 |
| `trabajo` → `descanso` | fin_serie |
| `trabajo` → `cambio_lado` | cambio_lado |
| `cambio_lado`, últimos 3 s | cuenta_3 · cuenta_2 · cuenta_1 |
| `descanso` → `preparado` | fin_descanso |
| entra en `fin` | fin_sesion |

**No hay cuenta atrás durante el descanso**, y es a propósito. El descanso
desemboca en `preparado`, que ya trae sus nueve segundos con su propio 3-2-1.
Poner las dos serían ocho tonos en doce segundos y dejarían de significar
nada. El final del break lo marca `fin_descanso`.

**En el trabajo por repeticiones no hay cuenta atrás** porque no hay final
previsible: el reloj cuenta hacia arriba y espera a que toques "Listo".

En pausa no suena nada, y al reanudar tampoco: el sonido marca eventos de la
sesión, no acciones tuyas.

## Nada de voz

La app no dice números ni nombres. Los tres tins suben de altura y el oído
reconoce la subida como "ya casi" sin tener que contar. Una voz obligaría a
mantener un audio por idioma y a depender de que el TTS del teléfono tenga
español instalado.

## Diseño técnico

- Los nueve players se crean **al montar el reproductor**, no al sonar.
  Crearlos en el momento del disparo mete entre 50 y 200 ms de retraso, y un
  tin que llega tarde es peor que ninguno.
- Antes de cada disparo se hace `seekTo(0)`. Sin eso, el segundo tin del
  mismo archivo no suena porque el player ya está al final.
- `interruptionMode: 'mixWithOthers'`. Si traes música puesta, sigue sonando
  y el tin se mezcla encima.
- `playsInSilentMode: true`, para que suene aunque el iPhone esté en
  silencio. En una app de entrenamiento eso es lo esperado.
- Cada tin se dispara una sola vez por segundo y por serie. Sin ese candado,
  pausar y reanudar en el segundo 2 volvía a disparar el mismo tono.

## Ajuste del usuario

`Yo → Sonido → Tonos durante la sesión`. Encendido por defecto. Apagado,
`reproducir()` no hace nada y no se toca ningún player.

## Si falta un archivo

`generar_registry.py` comenta la línea del que falte en vez de escribir un
`require()` roto. La app arranca igual y ese momento simplemente no suena.

## Formato

mp3 mono, 44.1 kHz, 64 kbps. Si los reemplazas por sonidos grabados,
normaliza el lote: un salto de volumen entre el tin de cuenta y el de fin de
serie se nota más que un sonido mediocre parejo.
