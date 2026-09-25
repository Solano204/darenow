# DARENOW · Goma y Magnesia

La app se siente como el piso de un gym a las 6 am: goma negra con motas de color, magnesia blanca en el aire y las placas olímpicas como única fuente de color.

Tokens en `src/theme/`. Cualquier color, tipografía, espacio o movimiento sale de ahí. `npm run lint:color` falla si aparece un hex o `rgba()` fuera de `src/theme/`.

## Principios

1. Una firma, no mil efectos: el aplauso de magnesia y la barra de placas. Lo demás es disciplinado.
2. El movimiento tiene masa: resortes pesados, overshoot mínimo. Las cosas caen y asientan.
3. El color significa algo. Azul = acción. Verde, amarillo y rojo = veredicto científico (Comprobado, Parcial, Mito) y placas de progreso. Nunca decorativo.
4. Foto a sangre, texto anclado abajo. Sin huecos muertos.
5. Sin brillos falsos, insignias «PRO», confeti ni gamificación que castigue.

## Color (`colors.ts`)

| Token | Hex | Uso |
|---|---|---|
| `goma` | `#1B1C1E` | Fondo base |
| `gomaAlta` | `#242528` | Tarjetas, hojas, tab bar |
| `gomaBorde` | `#34363A` | Divisores y bordes finos |
| `magnesia` | `#F2F1EC` | Texto principal, íconos activos |
| `magnesia2` | `#B9B7B0` | Texto secundario |
| `magnesia3` | `#7E7C77` | Íconos inactivos, bordes de control, texto no esencial |
| `placaAzul` | `#2553E8` | Acción: botón primario, indicador activo, foco |
| `placaAzulPresionado` | `#1C43C4` | Estado presionado |
| `placaVerde` | `#1FA463` | Comprobado, placa 1 |
| `placaAmarilla` | `#F2C230` | Parcial, placa 2 |
| `placaRoja` | `#E0412F` | Mito, placa 4 |

Reglas: verde, amarillo y rojo solo en insignias y en la barra de placas. Sin degradados de dos colores; solo foto → `goma` y variaciones de un mismo tono. Sombras grises suaves no existen: la profundidad es superficie más clara más borde de 1 px. Solo el botón primario lleva resplandor azul, y solo en iOS.

### Variantes medidas para AA

Medido con `node scripts/contraste.js`. Cuatro tokens del brief no pasan 4.5:1 como texto, así que existen variantes de texto y los originales se quedan para relleno, punto, borde e ícono.

| Caso | Original | Medido | Variante de texto | Medido |
|---|---|---|---|---|
| `magnesia3` sobre `gomaAlta` | `#7E7C77` | 3.68 | `magnesia3Texto` `#96948E` | 5.05 |
| `placaAzul` como texto sobre `gomaAlta` | `#2553E8` | 2.54 | `placaAzulTexto` `#6F8DFF` | 5.06 |
| Verde sobre su tinte al 16 % | `#1FA463` | 3.83 | `placaVerdeTexto` `#3DBE7A` | 5.18 |
| Rojo sobre su tinte al 16 % | `#E0412F` | 3.13 | `placaRojaTexto` `#FF6F5E` | 4.84 |

«Saltar» va en `magnesia2`, no en `magnesia3Texto`: cae sobre una foto y, con el scrim superior, `magnesia3Texto` mide ~3.5:1 y `magnesia2` ~5.2:1.

Blanco sobre `placaAzul`: 6.03. Sobre `placaAzulPresionado`: 7.93. Amarillo sobre su tinte: 6.34.

### Nombres antiguos

`color`, `degradado`, `insignia`, `sombra`, `radio` y `esp` conservan sus nombres y apuntan a la paleta nueva. Así las pantallas que no se rehacen heredan el sistema sin cambiar de API. `color.acento` es `placaAzulTexto` porque se usa como texto y glifo; el relleno de acción es `color.carbon`.

`colorSesion` (Reproductor) no se toca: fuera del alcance de este rediseño.

## Tipografía (`typography.ts`)

| Rol | Fuente | Tamaño / interlineado |
|---|---|---|
| `display` | Big Shoulders Display 800, tracking −0.5 | 46 / 44 |
| `h1` (título de sección o tarjeta) | Big Shoulders Display 700 | 26 / 28 |
| `numero` | Big Shoulders Display 800 | 40 / 40 |
| `cuerpo` | Figtree 400 | 16 / 24 |
| `cuerpoEnfasis`, botones | Figtree 600 | 17 / 22 |
| `etiqueta` | Figtree 500, tipo oración | 13 / 18 |
| `wordmark` | Big Shoulders Display 700, tracking 2 | 20 / 24 |

Big Shoulders no trae la característica `tnum`, así que `Odometro` mide cada celda de dígito con ancho fijo en vez de fiarse de `tabular-nums`. `@expo-google-fonts/big-shoulders-display` está marcado como deprecado (Google Fonts retiró ese nombre); los TTF van empaquetados y funcionan, solo que ya no reciben actualizaciones.

## Espacio y radios (`spacing.ts`)

Escala 4, 8, 12, 16, 24, 32, 48, 64. Margen lateral 24. Radios: foto en tarjeta 20, tarjeta 24, nota e insignia 8, botón primario 999 (alto 58).

## Movimiento (`motion.ts`)

| Token | Valor |
|---|---|
| `resortePlaca` | damping 15, stiffness 190, mass 1.2 |
| `resorteMagnesia` | damping 22, stiffness 120, mass 0.8 |
| `resorteTap` | damping 18, stiffness 400 |
| `dur` | rápido 140, medio 260, lento 480 ms |
| `easing.salida` | bezier(0.16, 1, 0.3, 1) |
| `easing.entrada` | bezier(0.7, 0, 0.84, 0) |

Todo corre en el hilo de UI con Reanimated. Solo se anima `transform` y `opacity` (la excepción es el ancho del botón, con layout animation). Cada efecto respeta `useReducedMotion`.

## Háptica (`haptics.ts`)

Respeta el ajuste existente de Ajustes (`forja:haptics`). Toque: Light. Aplauso: Heavy y, 90 ms después, Soft. Placa: Medium. Sello: Rigid. Pestaña: selección. Los dígitos del odómetro no vibran.

## Fotos

Las fotos actuales son claras y de baja resolución (447x800 y 800x423). Mientras no lleguen las nuevas (ver la lista de imágenes al cierre), `FotoTratada` las dibuja con Skia `ColorMatrix`: -35 % de saturación, exposición 0.72 y sombras un poco hacia azul frío. Sobre eso, un degradado transparente → `goma` (anclas 0.2, 0.5, 0.78, 1) y un scrim oscuro de 120 px arriba para que se lea el encabezado. `tratar={false}` desactiva el tratamiento cuando la foto ya viene oscura. El sobrante del recorte se alinea con `foco` (arriba en el onboarding, 55 %/30 % en la bienvenida) para no cortar cabezas.

## Piso de goma

`GomaTexture` tesela `assets/img/goma-tile.png`: grano fino al 10 % de alfa máximo y 18 motas de color al 6 %. Un solo bitmap para todas las pantallas, sin trabajo por fotograma. Se regenera con `npm run goma` (semilla fija).

Desviación del brief: pedía Skia. Un `Canvas` de Skia por pantalla son N superficies GPU vivas a la vez, porque el Stack nativo mantiene montadas las de abajo; un tile compartido cuesta un bitmap y se ve igual.

## Componentes

| Carpeta | Piezas |
|---|---|
| `components/ui` | `BotonPlaca`, `NotaEntrenador`, `InsigniaEvidencia`, `TarjetaGoma` |
| `components/fx` | `GomaTexture`, `MagnesiaParticles`, `MagnesiaOverlay`, `Odometro`, `TituloEstampado`, `TituloMascara`, `BarraPlacas`, `DialTiempo`, `FotoParallax`, `TachadoMito` |
| `hooks` | `useReducedMotion`, `useFirstView`, `useWelcomeData`, `usePresentacion` |

## Dependencias añadidas

`react-native-reanimated` 4.5.1, `react-native-worklets` 0.10.1, `@shopify/react-native-skia` 2.6.2, `@expo-google-fonts/big-shoulders-display`, `@expo-google-fonts/figtree`. No se instalan `react-native-gesture-handler` ni `react-native-svg`: ningún gesto ni SVG nuevo los necesita. Requiere un build nativo nuevo (dev client o EAS); no corre en Expo Go.
