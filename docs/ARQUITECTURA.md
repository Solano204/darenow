# DARENOW · Arquitectura

Léelo antes de crear un archivo. Las reglas de dependencias las revisa `npm run lint` (y `npm run lint:capas`); los ciclos, `npm run circulares`; el código muerto, `npm run muerto`.

## Carpetas

```
App.tsx                 navegacion: Stack + Tabs de React Navigation, providers, fuentes, splash
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
  data/                 catalogo (JSON de assets/data) y textos: catalog, mensajes, nombresVisibles, perfil
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

## Limites

- Ningun archivo pasa de ~300 lineas (excepcion: `media/registry.ts`, generado). Si crece, subcomponentes a `components/`, logica a `hooks/`, funciones puras a `utils/`.
- Toda pantalla nueva entra en `docs/perf/SMOKE.md` si es un flujo critico.

## Verificacion antes de un commit

```bash
npx tsc --noEmit          # 0 errores
npm run lint              # 0 errores (los avisos del React Compiler son trabajo de R4)
npm run lint:color
npm run test:unit         # Jest
for t in player engine ui rutinas borrarTodo detalleRutina detallePrograma musculos aprender perfil ajustes; do npm run -s test:$t | tail -1; done
npm run circulares        # 0 ciclos
npm run muerto            # knip sin hallazgos
```
