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

Las fotos actuales son claras y de baja resolución (447x800 y 800x423). Mientras no lleguen las nuevas (`docs/IMAGENES.md`), `FotoTratada` las dibuja con Skia `ColorMatrix`: -35 % de saturación, exposición 0.72 y sombras un poco hacia azul frío. Sobre eso, un degradado transparente → `goma` (anclas 0.2, 0.5, 0.78, 1) y un scrim oscuro de 120 px arriba para que se lea el encabezado. `TRATAR_FOTOS = false` (en `FotoTratada.tsx`) desactiva el tratamiento cuando llegan las fotos nuevas, ya oscuras. El sobrante del recorte se alinea con `foco` (arriba en el onboarding, 55 %/30 % en la bienvenida) para no cortar cabezas.

## Resto de la app

- **Barra de pestañas** (`TabBarGoma`): flotante, con margen de 12 a los lados y sobre el borde inferior (`separacionBarra`), radio 24, borde de 1 px, `gomaAlta` con desenfoque en iOS (color al 96 % en Android), íconos `magnesia` activos y `magnesia3` inactivos, y una barrita `placaAzul` de 16×3 que se desliza bajo la pestaña activa con `resortePlaca`. El ícono que se activa entra de 0.9 a 1 con un toque de selección. Mientras se baja por una lista baja 8 px y se vuelve un 10 % más transparente: `useScrollCabecera` escribe la dirección en `barraBajada` (`hooks/useBarraFlotante`) y la barra la lee. `useHuecoAbajo` cuenta el alto de la barra más su separación. Una revisión anterior había pedido «ya no flotante» y se resolvió pegada; la Parte 3 pide explícitamente la flotante, así que ese punto queda superado.
- **Tarjetas**: `gomaAlta`, borde de 1 px, radio 24, sin sombra. Al presionar, escala 0.98 y 5 % más oscura (`Toque` con `oscurecer`).
- **Insignias**: un solo componente, `InsigniaEvidencia`. `Insignia` (la de las fichas) lo envuelve.
- **Notas**: `Nota` ya no usa amarillo ni rojo; solo sube el borde. Los colores de veredicto quedan para las insignias.
- **Transiciones**: las pantallas del Stack entran con fundido y escala 0.98 → 1 (`screenLayout` en `App.tsx`); `Tabs` con 1.02 → 1. Reproductor, Resumen, Bienvenida y EditorRutina conservan la suya. No hay transición de elemento compartido: en Reanimated 4 con el Stack nativo todavía es experimental.
- **Cabeceras que se encogen**: Yo usa `TituloGrande` + `BarraCompacta`: el título grande se encoge y se desvanece (0 a 56 px de scroll) y aparece una barra compacta (40 a 72 px). Hoy usa `HeaderColapsable` (ver más abajo). Explorar y Aprender tienen su cabecera fija con buscador y pestañas internas, así que no se encoge.
- **Margen lateral** 24 en todas las pantallas de pestaña.
- Se quitó el barrido de luz (`Brillo`) y el resplandor de fondo: brillos falsos.

## Piso de goma

`GomaTexture` tesela `assets/img/goma-tile.png`: grano fino al 10 % de alfa máximo y 18 motas de color al 6 %. Un solo bitmap para todas las pantallas, sin trabajo por fotograma. Se regenera con `npm run goma` (semilla fija).

Desviación del brief: pedía Skia. Un `Canvas` de Skia por pantalla son N superficies GPU vivas a la vez, porque el Stack nativo mantiene montadas las de abajo; un tile compartido cuesta un bitmap y se ve igual.

## Cuenta, cuestionario y plan listo (Parte 2)

- **Botón de Google** (`BotonGoogle`): variante oscura de la marca (`#131314`, borde `#8E918F`, texto `#E3E3E3`, tokens `google` en `colors.ts`), logo «G» oficial dibujado con Skia desde su ruta SVG, cápsula de 58. El texto va en Figtree, no en Roboto que sugiere la guía. Mientras espera, tres puntos de magnesia reemplazan al texto y el botón no cambia de tamaño.
- **Botón bloqueado** (`BotonPlaca`): superficie vacía (`gomaAlta` con borde) y texto `magnesia3Texto`. Al habilitarse, el azul lo llena de izquierda a derecha en 320 ms y da un toque Light; al bloquearse, se vacía al revés. Aplica a todos los botones primarios, no solo al del cuestionario. Con `brillo` da un único barrido de luz (solo lo usa «Empezar» del plan).
- **Barra de carga** (`BarraCarga13`): una placa por paso, con el total dinámico. El cuestionario tiene 14 pasos definidos y arranca contando 13 porque el peso objetivo se omite hasta responder el peso; con «gym» se omiten tres. Háptica Medium solo en los pasos 5, 9 y el último.
- **Transición**: `useTransicionPaso` saca el contenido actual (24 px y opacidad 0, 180 ms), cambia el paso y el contenido nuevo entra con sus propias animaciones (título por máscara, zona de respuesta desde 24 px). La barra y los botones no se mueven. Ignora toques mientras corre.
- **Opciones** (`OpcionCuestionario`): se hunden, borde y fondo pasan al azul, el indicador se llena, la palomita se dibuja de trazo (`PalomitaTrazo`, Skia) y sale una nube de 10 partículas. Esa nube reutiliza el motor de `MagnesiaOverlay` (`mini`); no hay un Canvas por fila. Íconos de objetivo: Ionicons de línea.
- **Contador** (`ContadorPlacas`): número de 120 que rueda hacia arriba o hacia abajo (`Odometro continuo`), botones de 64, sacudida y háptica de aviso en los límites, y la semana de siete placas solo para los días por semana. El número se sigue pudiendo tocar y escribir, con el mismo acotado de antes.
- **Nombre**: `SaludoPreview` muestra el saludo real (`saludo()` de `mensajes.ts`) mientras se escribe.
- **Plan listo** (`PlanListo`): tres `PlacaDato` que caen con su golpe. El filo verde, amarillo y azul es una excepción a la regla del color: representan las tres «cargas» del plan. Las etiquetas de «Sin saltos ni ruido», «Zonas protegidas» y los avisos se conservan bajo las placas; el contenido hace scroll si no cabe. El destello de magnesia (`destello()`) sustituye a la barra que se comprime.
- **Errores de Google**: el texto usa `placaRojaTexto` (AA), no el rojo puro.

## Hoy (Parte 3)

Un solo azul por vista en la tarjeta de la sesión: «Empezar». Lo demás es `goma`, `gomaAlta` y `magnesia`. Entre módulos hay 48 px.

- **`HeaderColapsable`**: encabezado fijo con saludo, título en Big Shoulders 38 y botón de búsqueda. Con 44 px de scroll el saludo se desvanece, el título se encoge a 0.62 anclado abajo a la izquierda y todo el bloque sube hasta una barra de 52 px con borde inferior. Todo va ligado al scroll con worklets (`interpolate`, sin estado de React). Con movimiento reducido no se encoge: se va con el contenido.
- **`TarjetaSesionHoy`** («la barra de hoy»): `TarjetaGoma` de radio 28. Cabecera con el objetivo y dos cifras de 56 (`Odometro continuo`: minutos y ejercicios); a la derecha una barra olímpica de seis placas que se deslizan a su sitio («cargar la barra»), solo la primera vez en la sesión de la app (`barraCargadaEnEstaSesion` a nivel de módulo, no de pantalla). Debajo, los ejercicios (`MiniaturaEjercicio`, 112×112, número de orden, nombre completo a 2 líneas como mínimo) en un `FlatList` con `getItemLayout`; la foto interior va al 85 % de la velocidad del carrusel (escala 1.3, desplazamiento del 15 %, tope 16 px). Los avisos del motor van como `NotaEntrenador`. `BotonPlaca` con aplauso es el único azul; `BotonFilaSecundario` (superficie sólida, dial de 30 px que marca 45 min y gira hasta 5 al tocar). Al subir con el scroll (0 a 260 px) la tarjeta baja a 0.95 y 65 % de opacidad.
- **Hecho hoy**: la barra se cambia por una huella de mano de 120 px (`Huella`, hecha con vistas, no imagen) y la etiqueta «Hecho hoy»; «Entrenar otra vez» pasa a `BotonSecundario`. Al volver a Hoy con una sesión nueva terminada hoy, la huella se estampa (1.4 → 1, `resortePlaca`) con háptica Medium. Se detecta con `useFocusEffect`, no al montar.
- **`TarjetaEnfoque`** 280×300 con `CarruselProfundidad`: el enfocado a escala 1 y opacidad 1, los vecinos a 0.92 y 0.6 con 3° de giro hacia fuera, y la foto y el atleta a otra velocidad. Si existe `<id>_recorte` el atleta rompe el marco 44 px por arriba; si no, la foto va dentro. `NivelPlacas` (verde, amarilla, roja; las que faltan en contorno) y `BotonCompacto` «Inicio».
- **`TarjetaRutina`** de 240 px: foto de 150 con tratamiento, duración una sola vez en la insignia, `EstrellaFavorito` con relleno de resorte y nube de magnesia pequeña. Las rutinas propias llevan `BarraRutina` (un segmento por ejercicio) y, si ya se hicieron, una `Huella`.
- **Tu semana** (`FilaSemana` + `TuSemana`): siete columnas; una huella en el día con sesión; hoy, un anillo azul dibujado con Skia (único `Canvas` de la fila); los días sin sesión son un círculo apagado, sin cruces ni rojos. Debajo, la racha en 72 y siete barras de minutos.
- **Solo tres bloques bajo el pliegue se animan** (`BloqueRevela`): Tu semana, Explorar todo y Tu programa. Se revelan una vez, cuando el scroll los trae, y arrancan sus cifras y barras en ese momento. El resto es estático. `PilaProgramas` es un efecto ligado al scroll, no de entrada.
- **Fotos de lista** (`FotoOscura`): `expo-image` con `cachePolicy="memory-disk"`, exposición 0.8 sobre `gomaAlta`, velo a goma y `Esqueleto` mientras decodifica. El tratamiento con Skia se reserva para las fotos grandes: un `Canvas` por tarjeta no escala.
- **Arrastrar para actualizar**: `RefreshControl` nativo, con nube de magnesia. Los datos son locales; solo se vuelve a leer la fecha.
- **Movimiento reducido**: sin encogimiento del encabezado, sin parallax ni giro, sin escala al subir; la barra de pestañas no baja. Quedan los fundidos.

Faltan en el repo las Partes 6 a 12 que el brief cita: `BarraRutina`, `Huella`, `SieteDias`, `AccionSeccion`, `NivelPlacas`, `FichaMusculo` y `TarjetaArticulo` se crearon aquí en su versión mínima. `TextoDesvanecido`, el medidor de evidencia y el elemento compartido no se crearon: no hay texto que desvanecer, los tips no tienen evidencia y el Stack nativo no soporta el elemento compartido (ver arriba).

## Componentes

| Carpeta | Piezas |
|---|---|
| `components/ui` | `BotonPlaca`, `BotonCompacto`, `BotonFilaSecundario`, `NotaEntrenador`, `InsigniaEvidencia`, `TarjetaGoma`, `TabBarGoma`, `HeaderColapsable`, `Esqueleto`, `FotoOscura`, `NivelPlacas`, `Presionable`, `AccionSeccion` (y `CabeceraSeccion`), `cabecera` (`TituloGrande`, `BarraCompacta`) |
| `components/fx` | `GomaTexture`, `FotoTratada`, `FotoParallax`, `MagnesiaParticles`, `MagnesiaOverlay` (`ProveedorMagnesia`, `useMagnesia`), `Odometro`, `TituloEstampado`, `TituloMascara` (y `TituloLetras`), `BarraPlacas`, `DialTiempo`, `TachadoMito`, `Entrada`, `Huella` |
| `components/hoy` | `TarjetaSesionHoy`, `MiniaturaEjercicio`, `TarjetaEnfoque`, `CarruselProfundidad`, `CarruselHoy`, `TarjetaRutina`, `BarraRutina`, `EstrellaFavorito`, `FilaSemana`, `TuSemana`, `BloqueRevela`, `FilaExplorar`, `TuPrograma`, `PilaProgramas`, `TarjetasHoy` (`TarjetaEjercicioMini`, `FichaMusculo`, `TarjetaArticulo`), `EstadisticasHoy` |
| `hooks` | `useReducedMotion`, `useFirstView`, `useWelcomeData`, `usePresentacion`, `useOnboarding`, `useTick`, `useBarraFlotante` |

Las imágenes nuevas, con nombre, tamaño y prompt, están en `docs/IMAGENES.md`.

## Reanimated 4 en este proyecto

- Todo estilo animado se escribe con un worklet inline que depende de valores primitivos. Un worklet creado por una función (`useAnimatedStyle(factoria(1))`) se recrea en cada render.
- `useAnimatedStyle` congela el estilo inicial al montar y un commit de React puede volver a aplicarlo. Donde una capa depende de un valor compartido que cambia fuera de su propio ciclo (`useCapa` en `Presentacion`), se cuentan los renders y se pasa el contador como dependencia: el mapper se reevalúa tras cada commit y la capa vuelve a su sitio.
- No se anidan vistas animadas cuando el padre solo aporta un desplazamiento: la barra de placas aplica el temblor a cada elemento, no a un contenedor.
- Un callback de UI que toca JS (`haptico`) se pasa por una función suelta y `runOnJS`, nunca un método de un objeto capturado.
- Un worklet no debe capturar el objeto de props completo: se desestructura antes (`const { y } = p`), o Reanimated intenta serializar las funciones y los datos de la sesión.

## Dependencias añadidas

`react-native-reanimated` 4.5.1, `react-native-worklets` 0.10.1, `@shopify/react-native-skia` 2.6.2, `@expo-google-fonts/big-shoulders-display`, `@expo-google-fonts/figtree`. No se instalan `react-native-gesture-handler` ni `react-native-svg`: ningún gesto ni SVG nuevo los necesita. Requiere un build nativo nuevo (dev client o EAS); no corre en Expo Go.
