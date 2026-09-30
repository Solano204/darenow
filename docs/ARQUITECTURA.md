# DARENOW · Arquitectura

Léelo antes de crear un archivo. Las reglas de dependencias las revisa `npm run lint` (y `npm run lint:capas`); los ciclos, `npm run circulares`; el código muerto, `npm run muerto`.

## Carpetas

```
App.tsx                 navegacion: Stack + Tabs de React Navigation (pantallas con getComponent), providers, splash
index.ts                entrada (registerRootComponent)
src/
  features/<feature>/   una por area de la app
    screens/            pantallas registradas en App.tsx (y las que solo monta otra pantalla)
    components/         componentes que usa solo esta feature
    hooks/              la logica de sus pantallas (useHoy, useAjustes, useEditorRutina...)
    utils/              funciones puras de la feature
  ui/                   sistema de diseño compartido
    theme/              tokens: colores, tipografia, espacio, movimiento, fases, haptica
    components/         piezas compartidas (BotonPlaca, TarjetaGoma, Tocable, HojaInferior, FotoOscura...)
    fx/                 efectos: Odometro, MagnesiaOverlay, Entrada, Esqueleto, CarruselProfundidad...
    hooks/              useReducedMotion, useTick, useBarraFlotante, useNumeroEditable
  state/                estado global: store (ProveedorEstado/useEstado), cuenta, preferencias
  storage/              persistencia: claves de AsyncStorage, respaldo, claves forja:*
  data/                 catalogo y textos: catalog, aprender (mitos, glosario...), logros, mensajes, nombresVisibles, perfil
    indice/ detalle/    GENERADOS por scripts/build-catalogo.ts (npm run catalogo); no se editan a mano
  lib/                  utilidades puras compartidas: plural, fechas, presentacion, textosVisibles, legal
    engine/             motor de sesion (armarSesion, rutinas propias, duracion)
  media/                registros de imagenes, clips, voz y sonidos (GENERADOS por generar_registry.py)
  dev/                  solo desarrollo: perfMarks (ver scripts/perf/README.md)
tests/                  tests/*.test.ts: scripts con esbuild (npm run test:*); tests/unit: Jest (npm run test:unit)
scripts/                generadores (iconos, goma, banner), lint-color, perf/, refactor/
```

Features: `onboarding` (Presentacion, Onboarding, PlanListo), `cuenta` (Acceso), `hoy` (Bienvenida, Hoy), `sesion` (Reproductor, Resumen), `ejercicio`, `explorar`, `rutinas` (DetalleRutina, RutinaPropia, EditorRutina), `programas`, `musculos`, `aprender` (Aprender, DetalleTip, DetalleMito), `perfil` (Yo, Favoritos, Retos, Mediciones, Historial), `ajustes`.

No hay `app/` de expo-router: la app usa React Navigation 7 y las rutas viven en `App.tsx` (ver `docs/FUNCIONALIDAD.md` §1 y §3). Cambiar a expo-router cambiaria la navegacion y queda fuera de la serie de rendimiento.

## Reglas de dependencias

1. **Una feature no importa de otra feature.** Si dos features necesitan algo, se mueve a `ui/`, `lib/`, `data/` o `state/`.
2. **Las capas compartidas (`ui`, `state`, `storage`, `lib`, `data`, `media`, `dev`) no importan de `features/`.**
3. **Sin ciclos** entre modulos.
4. `media/*` se regenera: no se edita a mano (`python3 generar_registry.py`). El resto de `sonido.ts` si.
   `data/indice/` y `data/detalle/` tambien: se editan los JSON de `assets/data` y se corre `npm run catalogo`.
5. Colores solo en `src/ui/theme/` (`npm run lint:color`).

Las reglas 1 y 2 son `no-restricted-imports` en `eslint.config.js`: un import que las rompe falla el lint.

## Imports

- Mismo directorio: `./Nombre`.
- Todo lo demas de `src/`: alias `@/…` (`@/ui/theme`, `@/state/store`, `@/features/hoy/hooks/useHoy`). Lo resuelven Metro (tsconfigPaths), esbuild y Jest.
- Assets y `package.json`: ruta relativa.
- Para mover archivos: `python3 scripts/refactor/mover.py plan.json` (hace `git mv` y reescribe todos los imports).

## Nombres

- Componentes y pantallas: `PascalCase.tsx`, un componente principal por archivo, exportado con nombre (las pantallas, `export default`).
- Hooks: `useAlgo.ts` (o `.tsx` si devuelven JSX).
- Utilidades y datos: `camelCase.ts`.
- Archivos por plataforma: `Nombre.ios.tsx` + `Nombre.tsx` con la misma interfaz, solo cuando el componente se comporta distinto (ej. `DesenfoqueIos`). Un ajuste de una linea va con `Platform.OS`/`Platform.select`.
- Nombres de dominio en español (como el resto del codigo); props tambien (`etiqueta`, `estilo`, `deshabilitado`).

## Donde va cada cosa nueva

| Quiero agregar… | Va en |
|---|---|
| una pantalla | `features/<feature>/screens/` y se registra en `App.tsx` |
| la logica de esa pantalla (estado, memos, manejadores) | `features/<feature>/hooks/useNombre.ts`; la pantalla solo dibuja |
| un componente que usa una sola feature | `features/<feature>/components/` |
| un componente que usan dos features o mas | `ui/components/` (o `ui/fx/` si es un efecto) |
| algo tocable | `Tocable` (`ui/components/Tocable.tsx`) o `Pressable`; nunca `Touchable*` |
| una hoja inferior | `HojaInferior` con sus acciones como `children` |
| una funcion pura | `features/<feature>/utils/` si es de una feature; `lib/` si es compartida |
| un dato del usuario que se guarda | la accion en `state/acciones.ts`, el tipo en `state/tipos.ts`, la clave en `storage/claves.ts` |
| un color, tamaño de letra, espacio o curva | un token en `ui/theme/` |
| un log de depuracion | nada en produccion; `no-console` avisa |

## Arranque (R3)

Lo que se evalua al abrir la app es lo que cuelga de `index.ts` por `import` estatico. Para no volver a cargarlo:

- **Pantalla nueva**: se registra con `getComponent={() => require('@/features/x/screens/X').default}`, no con `import`. Solo Hoy y Bienvenida van con `import`.
- **Catalogo**: `EJERCICIOS`, `MUSCULOS` y `TIPS` son el indice (sin textos largos). Si necesitas `steps`, `cues`, `desc`, `funcion`, `cuerpo`… usa `getEjercicio(id)`, `getMusculo(id)` o `getTip(id)`. Datos nuevos de una sola pantalla van en su propio modulo de `data/` (como `aprender.ts`), no en `catalog.ts`.
- **`scripts/build-catalogo.ts`** (`npm run catalogo`): lee `assets/data/*.json` y escribe `data/indice/` (listas sin textos, `patron` puesto, salas, conteos) y `data/detalle/<tipo>.json` (textos por id). Correrlo al cambiar `assets/data` y commitear lo generado; `npm run test:unit` compara contra el catalogo de antes de R3.
- **Almacenamiento**: la primera lectura de estado, cuenta y vibracion pasa por `storage/lecturaInicial.ts` (un `multiGet`). Una clave nueva que se lea al arrancar se agrega ahi.
- **Splash**: `ui/hooks/useSplash.ts`. `mantenerSplash()` en `App.tsx`; se oculta en el `onLayout` de la primera pantalla con datos. Una animacion de entrada que deba verse espera `useSplashOculto()`.
- **Fuentes**: `ui/theme/fuentes.ts` (iOS, `useFonts`) y `fuentes.android.ts` (ya incrustadas por el plugin `expo-font` de `app.json`). Un peso nuevo se agrega en los dos y en `app.json`.
- **Iconos**: `import Ionicons from '@expo/vector-icons/Ionicons'`, nunca el indice del paquete.
- **`freezeOnBlur`** esta activo en pestañas y Stack. Una pantalla que deba seguir corriendo efectos tapada (como el Reproductor) lo apaga en sus `options`.

## Estado y renders (R4)

El React Compiler esta activo (`app.json`, `experiments.reactCompiler`) y sus reglas de ESLint son error. Para que una interaccion vuelva a dibujar solo lo que cambio:

- **Estado global**: vive en `useTienda` (`state/tienda.ts`). Se lee con un selector del trozo que se pinta (`useEstadoSel(e => e.racha)`, `usePerfil()`, `useEsFavorito(tipo, id)`), nunca el estado entero. Varios valores a la vez: `useShallow`. Se cambia con las funciones de `state/acciones.ts` (de modulo, estables); no se pasan por props ni por contexto.
- **Persistencia**: `cambiar()` guarda `forja:v1` agrupado. Una clave o un formato nuevo no entra sin migracion y su prueba en `tests/unit/persistencia.test.ts`.
- **Contextos**: solo para valores que casi no cambian (cuenta, anuncios, magnesia). Un valor que cambia seguido va a un store con selectores.
- **Derivar, no copiar**: lo que se calcula de otro estado se calcula en el render (o en `state/derivados.ts`, que guarda el resultado por arreglo de sesiones). Nada de `useState` + `useEffect` para copiarlo. Lo que no se pinta va en `useRef`.
- **Efectos**: solo para sincronizar con algo externo (animacion, temporizador, sonido, suscripcion, almacenamiento), siempre con su limpieza. Lo que dispara el usuario va en el manejador. Si el efecto necesita leer algo sin volver a correr, `useEffectEvent`; nunca se silencia `exhaustive-deps`. `node scripts/perf/efectos.js` los clasifica.
- **Actualizaciones inmutables**: arreglos y objetos nuevos (`[...a, x]`, `{ ...o, k }`). `derivados.ts` depende de esto.
- **Listas**: filas en `React.memo` sin comparador; callbacks por id (`onPress(id)`), no un closure por fila; `renderItem`/`keyExtractor` fuera del JSX; sin estilos en linea en filas. Keys por contenido; por indice solo en listas estaticas que nunca se reordenan. La estrella de favorito de una fila es `EstrellaDe({ tipo, id })`.
- **Busqueda y filtros**: el campo y el chip se actualizan al instante; la lista se filtra con `useDeferredValue` (o `startTransition`). Textos normalizados precalculados en `data/indice/busqueda.json`.
- **Lo que cambia cada segundo o cada frame**: un componente hoja que lee solo ese valor (como `NumeroSesion` o `SonidoDeSesion` del reproductor, que leen el store de la sesion con `useTiempoSesion`/`useDeSesion`), o un shared value de Reanimated. La pantalla no se suscribe al reloj.
- **Render props**: el compilador no memoriza el JSX dentro de una funcion que se pasa como prop. Si el contenido es grande, se saca a un componente (como `CuerpoAjustes`).
- **`'use no memo'`**: solo con un comentario que diga por que. Hoy: `useTick` y `PantallaColapsable`. `node scripts/perf/compilador.js` lista lo que queda fuera.
- **Medir**: `RENDERS_SALIDA=x.json npx jest tests/unit/renders/interacciones` graba los re-renders de las interacciones clave; comparar con `docs/perf/renders/despues.json`.

## Listas, imagenes y clips (R5)

**Que lista usar**

- **Lista larga** (mas de ~20 elementos, o que crece sin tope: historial, favoritos) -> `ListaAnimada` (FlashList con el `onScroll` de Reanimated) de `ui/components/listaVirtual.tsx`, o `FlashList` si no hace falta el scroll animado. Filas y encabezados distintos -> `getItemType`. Una pantalla con titulo colapsable y lista larga -> `PantallaColapsableLista`.
- **Lista corta y fija** (menos de ~20: pasos, opciones, logros) y **pantalla de contenido** (ficha, articulo) -> `ScrollView` con sus secciones.
- **Carrusel horizontal**: con mas de ~10 elementos, FlashList `horizontal`; si no, `ScrollView`/`FlatList` horizontal. Con snap: `snapToInterval` + `decelerationRate="fast"` + `disableIntervalMomentum`. Profundidad y parallax, en worklets desde el shared value del scroll.
- No se mezcla con otra libreria de listas.

**Filas que se reciclan** (FlashList reusa la celda para otro elemento):

- Nada de estado local del elemento sin reiniciarse al cambiar el id: mejor del store (R4). Los shared values por fila se reinician con `useReinicioPorId`.
- Una fila con mucho estado interno (medidas, sellos) se monta por id: `key={id}` en `renderItem`.
- Entrada de las primeras filas: `EntradaUnaVez` / `useUnaVez` con `idsAnimados('<lista>')`, una vez por elemento.
- Al cambiar el resultado (filtro, busqueda): `useFundidoAlCambiar` (fundido de 150 ms). No se usan `entering`/`exiting`/`itemLayoutAnimation` dentro de FlashList.
- Ninguna fila monta un player de video.

**Imagenes**

- Toda imagen pasa por `ui/components/Imagen.tsx` (o por `Foto`/`FotoOscura`, que la usan): cache `memory-disk`, blurhash, `transition={150}`, `recyclingKey`. Unica excepcion: la textura `goma-tile.png` (`Image` de RN por `resizeMode="repeat"`).
- En un recuadro de 64 dp o menos se usa la miniatura (`mini`); `Foto` y `FotoOscura` lo deciden solas.
- Heroes con tratamiento de color (Skia): `FotoTratada` con `useImagenSkia` (cache de 4). La tarjeta que abre un hero lo precarga al presionar (`alPresionar` de `Tocable` + `precargarSkia`).
- Precarga solo lo que se va a ver enseguida (`precargar` de `Imagen`): nunca el catalogo entero.

**Clips**

- `ui/components/ClipEjercicio.tsx` es el unico componente de clip; `media/players.ts` crea y suelta todos los players.
- Un player por clip en pantalla; en listas y carruseles, la foto. Al salir de la pantalla (blur) pausa y suelta el video; en segundo plano, pausa; al desmontar, se libera. Meta: 1 reproduciendo (2 vivos durante una transicion). Se comprueba con `EXPO_PUBLIC_PERF=1` (`[players]` en logcat).
- El reproductor deja preparado el clip siguiente en el descanso (`prepararClip`).

**Medios: originales y scripts**

- Los originales viven en `media-fuente/` (fuera de Metro por `metro.config.js`): `media-fuente/img/<carpeta>/<id>.jpg` y `media-fuente/video/ejercicios/<id>.mp4`. Nunca se editan los archivos de `assets/img` ni `assets/video`: se generan.
- `npm run imagenes` (`scripts/optimizar-imagenes.ts`, sharp): correrlo al agregar o cambiar una foto. Genera `assets/img/<carpeta>/<id>.webp` (q80, 800 px como maximo), las miniaturas `assets/img/{ejercicios,musculos}-mini/` (192 px, q75) y `src/data/indice/blurhash.json`, borra lo que ya no tiene original y reescribe `src/media/registry.ts`.
- `npm run clips` (`scripts/optimizar-clips.ts`, ffmpeg-static): correrlo al agregar o cambiar un clip. Genera `assets/video/posters/<id>.webp` (primer fotograma) y `assets/video/ejercicios/<id>.mp4` (H.264 main CRF 28 24 fps sin audio con faststart si ahorra 10 %; si no, el original tal cual) y reescribe `src/media/videos.ts`.
- `npm run catalogo` falla si un ejercicio apunta a un medio que no existe o si falta una version empaquetada, y avisa de los originales sin uso. Commitear lo generado.
- Nada de medios remotos: la app funciona sin internet.

## Limites

- Ningun archivo pasa de ~300 lineas (excepcion: `media/registry.ts`, generado). Si crece, subcomponentes a `components/`, logica a `hooks/`, funciones puras a `utils/`.
- Toda pantalla nueva entra en `docs/perf/SMOKE.md` si es un flujo critico.

## Verificacion antes de un commit

```bash
npx tsc --noEmit          # 0 errores
npm run lint              # 0 errores (reglas del React Compiler como error, sin supresiones)
npm run lint:color
npm run test:unit         # Jest
for t in player engine ui rutinas borrarTodo detalleRutina detallePrograma musculos aprender perfil ajustes; do npm run -s test:$t | tail -1; done
npm run circulares        # 0 ciclos
npm run muerto            # knip sin hallazgos
```
