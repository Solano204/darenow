# FUNCIONALIDAD congelada

> **Rutas:** este documento se escribió antes de la reorganización R2. La equivalencia de cada ruta citada (`src/screens/…`, `src/components/…`, `src/store/…`) está en `docs/perf/R2_MOVIMIENTOS.md`, y la estructura actual en `docs/ARQUITECTURA.md`.

Contrato del rediseño visual. Nada de lo que está aquí puede cambiar. Se recorre al final de cada fase y se marca cada punto.

Estado de la línea base (antes de tocar estilos): `tsc --noEmit` tiene 4 errores preexistentes, todos en `tests/` (`player.test.ts` x3, `ui.test.ts` x1). `test:ui` 21, `test:player` 63, `test:engine` 74, `test:rutinas` 31, `test:borrarTodo` 14: todas en verde.

## 1. Discrepancias entre el brief y el repo

| Brief | Repo real | Decisión |
|---|---|---|
| expo-router | React Navigation 7 (`App.tsx`): Stack nativo + Tabs inferiores | Se respetan nombres de ruta y parámetros tal cual |
| Onboarding de 4 pasos («Gratis. Todo. Sin trucos», Seguir, Empezar, Saltar) | Es `Presentacion.tsx` (4 láminas). El `Onboarding.tsx` es otra cosa: cuestionario de hasta 14 preguntas | Los 4 pasos del brief = `Presentacion`. El cuestionario recibe colores y tipografía nuevos, sin parallax |
| «Bien vuelto» + tarjeta con 3 números | `Bienvenida.tsx`; el mensaje sale de `mensajeDelDia` y solo es «Bien vuelto» tras 4 o más días sin entrenar | Sin cambio de lógica |
| Reanimated, Skia, gesture-handler, svg | Ninguno instalado | Se instalan Reanimated, worklets y Skia. gesture-handler y svg no: ningún gesto ni SVG nuevo los necesita |
| Ajuste de háptica «si existe» | Existe: `forja:haptics`, interruptor en Ajustes (`useHapticosActivos`) | `theme/haptics.ts` lo respeta |
| Modo claro/oscuro | No hay interruptor; la app era solo clara (`userInterfaceStyle: light`) | La app pasa a oscura; no hay switch que conservar |

## 2. Cadena de arranque (`App.tsx` → `Raiz`)

Orden estricto, decidido por estado persistido. Ninguna es una ruta: `Raiz` devuelve una pantalla u otra.

1. `cargando` (estado) o `cargandoCuenta`: spinner sobre `color.fondo`.
2. `!estado.presentacionVista` → `Presentacion` (`onTerminar = marcarPresentacion`).
3. `!cuenta` → `Acceso` (`onListo` vacío; al crear la cuenta `Raiz` se re-renderiza solo).
4. `!estado.onboardingHecho` → `Onboarding` (`onTerminar = terminarOnboarding(perfil)`).
5. Si no: `Stack.Navigator`, `initialRouteName = estado.bienvenidaVista === hoy() ? 'Tabs' : 'Bienvenida'`. La bienvenida sale una vez al día.

Splash: `preventAutoHideAsync` hasta que `useFonts` resuelve (éxito o error). Barra de gestos de Android oculta (`NavigationBar.setHidden(true)`).

## 3. Árbol de navegación

Stack (`native-stack`), animación por defecto `slide_from_right`:

| Ruta | Pantalla | Opciones relevantes |
|---|---|---|
| `Bienvenida` | Bienvenida | sin header, fade |
| `Tabs` | Pestañas | sin header, fade |
| `Reproductor` | Reproductor | sin header, `gestureEnabled:false`, `slide_from_bottom`, fondo `colorSesion.fondo` |
| `Resumen` | Resumen | sin header, `gestureEnabled:false`, fade |
| `Ejercicio` / `Musculo` / `Rutina` / `RutinaPropia` / `Programa` / `Tip` / `Mito` | Detalles | `title: ''` |
| `EditorRutina` | EditorRutina | `slide_from_bottom` |
| `Favoritos` / `Logros` / `Retos` / `Mediciones` / `Historial` / `Ajustes` | Listas de Yo | título propio |

Tabs (`bottom-tabs`, animación fade): `Hoy`, `Explorar`, `Aprender`, `Yo`.

Saltos entre pantallas (origen → destino, con parámetros):

- Bienvenida: Entrar → `replace('Tabs')`.
- Hoy: buscar → `Tabs/Explorar`; «Revisar mis lesiones en Ajustes» (solo sin ejercicios seguros) → `Tabs/Yo`; sesión del día y rutina rápida → `Reproductor {sesion}`; ejercicio → `Ejercicio {id}`; programa → `Programa {id}`; «ver más» → `Tabs/Explorar {tab: rutinas|programas|ejercicios|musculos}` (merge); `Musculo {id}`; `Tip {id}`; `Tabs/Aprender`.
- Explorar: `Ejercicio`, `Rutina`, `Programa`, `Musculo`, `RutinaPropia`, `EditorRutina` (nueva o con `id`), `volver → Hoy`.
- Aprender: `Tip`, `Mito`, `Ejercicio`, `Rutina`, `Programa`, `volver → Hoy`.
- Yo: `Favoritos`, `Logros`, `Retos`, `Mediciones`, `Historial`, `Ajustes`, `Ejercicio`.
- Detalles: `push Musculo/Ejercicio`, `Reproductor {sesion}`, `EditorRutina {id}` (copia), `goBack` al cambiar programa, `Tabs/Explorar`, `Rutina`.
- Reproductor: al terminar `replace('Resumen', …)`. Resumen: `Tabs/Hoy`.
- RutinaPropia: `Reproductor`, `replace('RutinaPropia')`, `goBack` al borrar, `EditorRutina`, `Ejercicio`.
- EditorRutina: `goBack` al guardar y en Cancelar, `Ejercicio`.
- Favoritos: `Tabs/Explorar` y `Tabs/Aprender` (con `tab`), más los detalles.

## 4. Presentacion (los 4 pasos del brief)

Archivo `src/screens/Presentacion.tsx`. Estado propio: índice `i` de lámina (0–3). No persiste nada por sí misma; solo llama `onTerminar` (= `marcarPresentacion`, que guarda `presentacionVista: true` en `forja:v1`).

| Control | Handler | Efecto |
|---|---|---|
| Seguir (láminas 1–3) | `avanzar` | `i + 1` |
| Empezar (lámina 4) | `avanzar` con `i === 3` | `onTerminar()` → `Raiz` pasa a `Acceso` |
| Saltar (siempre visible) | `onTerminar` | igual que Empezar, sin recorrer las láminas |
| Puntos de progreso | ninguno | no son tocables |
| Deslizar entre láminas | no existe | solo avanza con el botón; no hay «Atrás» |

Láminas, en orden (`id` de la foto de fondo → texto):

1. `intro_04`: «Gratis. Todo. Sin trucos». Cuerpo con `ESTADISTICAS.rutinas` y `ESTADISTICAS.programas`. Pie: «Sin tarjeta, sin suscripción, sin compras dentro de la app.»
2. `intro_01`: «Entrena lo que tú quieras trabajar». Cuerpo con `ESTADISTICAS.ejercicios`; los ocho objetivos que antes iban dentro de la frase ahora son ocho etiquetas debajo (mismas palabras, capitalizadas). Pie con `ESTADISTICAS.sinEquipo`.
3. `intro_02`: «La sesión cabe en tu tiempo». Pie: «Nada de rachas que se rompen y castigan.»
4. `intro_03`: «Te decimos lo que sí funciona, y lo que no». Pie con `ESTADISTICAS.mitos`. Se añaden tres insignias y la afirmación «Los abdominales queman la panza» tachada (visual, tomada del propio cuerpo).

Los números salen de `data/catalog.ts` (`ESTADISTICAS`), no están escritos a mano en la vista.

## 5. Acceso (entre Presentacion y Onboarding)

- «Continuar con Google» (solo si `google.disponible`): `google.iniciar`; al recibir `google.perfil` → `entrarConGoogle` → `google.limpiar()` → `onListo()`.
- «Entrar sin cuenta» (o «Empezar» si no hay Google): `entrarComoInvitado()` → `onListo()`.
- Enlaces «Términos» y «Aviso de privacidad»: `Linking.openURL(URL_TERMINOS | URL_PRIVACIDAD)`.
- Persistencia: `forja:cuenta:v1`.

## 6. Onboarding (cuestionario)

Archivo `src/screens/Onboarding.tsx`. Estado: respuestas `r`, índice `i`, `resumen`, `preparando`.

Pasos (los que tienen `saltarSi` se omiten): `objetivo` (obligatorio), `experiencia`, `diasPorSemana`, `minPorSesion`, `lugar`, `equipo` (omitido si `lugar === gym`), `espacio` (idem), `ruido` (idem), `contra`, `situacion`, `alturaCm` (saltable), `pesoKg` (saltable), `pesoObjetivoKg` (saltable; omitido si `pesoKg` no respondido), `nombre` (obligatorio).

| Control | Efecto |
|---|---|
| Seguir / «Ver mi plan» (último) | `avanzar`: aplica el valor por defecto si no se respondió, salvo en medidas (`alturaCm`, `pesoKg`, `pesoObjetivoKg`), que quedan sin responder. Avanza con animación lateral. En el último paso: pantalla «Preparando» 1100 ms → resumen |
| Atrás (si `i > 0`) | `i - 1` con animación lateral |
| «Prefiero no decirlo» (solo `saltable`) | borra la respuesta y avanza |
| Botón Seguir deshabilitado | si `obligatorio` y sin respuesta (o nombre vacío) |
| Contador de medidas | pide consentimiento (`pedirConsentimientoMedidas`) antes de guardar cualquier valor real |
| Nombre | se precarga con `cuenta.nombre` |
| Resumen → «Empezar» | `onTerminar(perfil)` → `terminarOnboarding`: guarda perfil y `onboardingHecho: true` |
| Resumen → «Cambiar algo» | vuelve al cuestionario |

Los avisos del resumen salen de `derivar(r)` (`data/perfil.ts`). `Onboarding.tsx` también reexporta `derivar`, `derivarNivel`, `elegirPrograma`, `avisosDe`: se conserva.

### 6.1 Parte 2: cuestionario paso por paso

Se definen 14 pasos. El conteo visible arranca en **13** porque `pesoObjetivoKg` se omite mientras `pesoKg` no tenga respuesta (`saltarSi: r.pesoKg === undefined`); si el usuario responde el peso pasa a 14, y con `lugar === gym` se omiten `equipo`, `espacio` y `ruido` (11). La cifra sale siempre de `pasos.length`, nunca fija.

| # | Campo | Tipo | Obligatorio | Defecto | Límites o valores | Se omite si |
|---|---|---|---|---|---|---|
| 1 | `objetivo` | opción única | sí | ninguno | los 8 de `GOALS` | nunca |
| 2 | `experiencia` | opción única | no | `nada` | nada, pausa, algo, constante | nunca |
| 3 | `diasPorSemana` | contador | no | 3 | 2 a 6, sufijo «días por semana» | nunca |
| 4 | `minPorSesion` | opción única (guarda número) | no | 20 | 10, 20, 30, 45, 60 | nunca |
| 5 | `lugar` | opción única | no | `casa` | casa, gym, exterior, mixto | nunca |
| 6 | `equipo` | opción múltiple | no | `[]` | `EQUIPO` con `onboarding` | `lugar === gym` |
| 7 | `espacio` | opción única | no | `colchoneta` | minimo, colchoneta, amplio | `lugar === gym` |
| 8 | `ruido` | opción única | no | `si` | si, no | `lugar === gym` |
| 9 | `contra` | opción múltiple | no | `[]` | 10 zonas | nunca |
| 10 | `situacion` | opción múltiple | no | `[]` | embarazo, postparto, hipertensión, vértigo | nunca |
| 11 | `alturaCm` | contador con número escrito | no (saltable) | 170 | 120 a 220, «cm» | nunca |
| 12 | `pesoKg` | contador con número escrito | no (saltable) | 70 | 35 a 200, «kg ahora» | nunca |
| 13 | `pesoObjetivoKg` | contador con número escrito | no (saltable) | 70 | 35 a 200, «kg objetivo» | `pesoKg` sin respuesta |
| 14 | `nombre` | texto | sí | vacío | no vacío tras recortar | nunca |

Reglas que no cambian:

- **Seguir** se habilita si `!paso.obligatorio || respondido`. `respondido` es «hay valor guardado y, si es texto, no está vacío». Solo `objetivo` y `nombre` pueden bloquearlo.
- Al pulsar Seguir sin haber respondido, se guarda el valor por defecto salvo en `alturaCm`, `pesoKg` y `pesoObjetivoKg` (medidas de salud: quedan sin responder).
- Escribir o cambiar una medida pasa por `pedirConsentimientoMedidas` antes de guardarse.
- **Atrás** (visible si `i > 0`) hace `i - 1` con la transición inversa y no toca `r`: las respuestas se conservan.
- «Prefiero no decirlo» (solo pasos saltables) borra la respuesta y avanza (o abre el resumen si era el último).
- En el último paso el botón dice «Ver mi plan»: pantalla «Preparando» de 1100 ms y después el resumen.
- Contador: − y + acotan a `min` y `max`; el número escrito se confirma al terminar de editar y se acota igual; `onCambio` solo se llama si el valor cambia al escribir.

### 6.2 Parte 2: plan listo

Sale de `derivar(r)` (`data/perfil.ts`): `perfil.diasPorSemana` («N por semana»), `perfil.minPorSesion` («N minutos»), `perfil.nivel` («N de 3»), y condicionales: `perfil.modoSinSaltos` → «Sin saltos ni ruido», `perfil.contra.length > 0` → «Zonas protegidas: N». `avisos` se muestran como notas. **Empezar** → `onTerminar(perfil)`; **Cambiar algo** → `setResumen(false)` (vuelve al último paso del cuestionario).

## 7. Bienvenida

Archivo `src/screens/Bienvenida.tsx`. Se ve una vez al día.

| Dato en pantalla | Fuente |
|---|---|
| Fecha | `new Date().toLocaleDateString('es-MX', {weekday:'long', day:'numeric', month:'long'})` |
| Saludo | `saludo(perfil.nombre \|\| undefined)` (`data/mensajes.ts`): banco por hora (<12 mañana, <19 tarde, resto noche), elegido con `getDate() % banco.length`; si hay nombre: «Saludo, Nombre» |
| Título, cuerpo e imagen de la tarjeta | `mensajeDelDia({sesiones: stats.total, diasRacha: racha.dias, diasSinEntrenar})`; imagen `Foto tipo="motivacion" id={msg.id}` |
| «día(s) seguido(s)» | `estado.racha.dias`; singular si vale 1 |
| «sesiones» | `estadisticas(sesiones).total` (todas las guardadas) |
| «días entrenados» | `estadisticas(sesiones).dias` (fechas distintas) |
| Fondo | `fuente('fondo', 'bienvenida')`; si falta, degradado de portada |
| Banner de anuncio | solo si `ANUNCIOS_ACTIVOS` (hoy `false`) |

Lógica condicional de `mensajeDelDia` (orden): 0 sesiones → «Bienvenido» (`mot_21`); 4 o más días sin entrenar → grupo «al volver» (`mot_18` «Bien vuelto», `mot_19`, `mot_20`); racha de 5 o más → grupo «con racha»; si no → grupo general. Dentro del grupo elige por fecha, no al azar.

`diasSin` = días entre `racha.ultimoDia` y hoy (0 si no hay `ultimoDia`).

Único control: **Entrar** → `marcarBienvenida()` (guarda `bienvenidaVista = hoy()`) y luego `navigation.replace('Tabs')`. Con el aplauso de magnesia la acción sigue siendo la misma y se dispara en el mismo instante; la nube vive en un overlay global (`ProveedorMagnesia` en `App.tsx`). El «Empezar» de Presentacion y el del resumen del cuestionario disparan el mismo aplauso con su acción actual.

## 8. Persistencia (AsyncStorage, todas bajo `forja:`)

| Clave | Contenido |
|---|---|
| `forja:v1` | Estado completo: `presentacionVista`, `onboardingHecho`, `bienvenidaVista`, perfil, sesiones, racha, favoritos, rutinas propias, logros, retos, etc. |
| `forja:cuenta:v1` | Cuenta (Google o invitado) |
| `forja:haptics` | `'1'`/`'0'`; activo por defecto |
| `forja:voz` | preferencia de voz |
| `forja:ajustes_maquina` | ajustes de máquina |
| `forja:consentimiento_medidas` | consentimiento de medidas |
| `forja:sesion_en_curso` | sesión a medias del reproductor |

No se cambia ninguna clave ni ningún contrato de datos.

## 9. Lo que el rediseño no toca

`store/*`, `engine/*`, `session/*`, `media/*` (salvo lo que ya se lista), `data/*` (salvo acentos en `mensajes.ts`), nombres de ruta, parámetros y claves de almacenamiento.

## 10. Registro de verificación

Se rellena al cerrar cada fase. ✅ = verificado sin dispositivo: lectura de código, `tsc`, suites de `tests/` y bundle de Metro. Lo que exige teléfono va en la lista de prueba del cierre (sección 17 del brief).

| Punto | F0 | F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|---|---|
| Arranque y orden Presentacion → Acceso → Onboarding → Bienvenida/Tabs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Seguir / Empezar / Saltar de Presentacion | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Acceso (Google, invitado, enlaces legales) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Onboarding: pasos, omisiones, obligatorios, consentimiento, resumen | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Entrar en Bienvenida (marca y navega a `Tabs`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Nombre, fecha, racha, sesiones, días entrenados | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Mensaje del día y su imagen | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Las 4 pestañas y sus saltos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Persistencia (onboarding no reaparece) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Ajuste de háptica respetado | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |

F6 queda sin marcar a propósito: se rellena tras la corrida final (`tsc`, suites, bundle, `expo-doctor`) y la prueba en dispositivo. En el emulador (Android 35, build de desarrollo) se comprobó el arranque, los cuatro pasos de la presentación y la ausencia de errores de JS; quedó pendiente volver a comprobar el paso 4 tras la última corrección de las capas de texto.

## 11. Registro de la Parte 2 (cuenta, cuestionario, plan listo)

Verificado sin dispositivo: lectura de código contra las secciones 5, 6, 6.1 y 6.2, `tsc` y `lint:color`. Pendiente de la prueba en dispositivo lo que va marcado.

| Punto | Estado |
|---|---|
| Google e invitado: mismos handlers, `onListo` igual | ✅ código |
| Términos y Aviso de privacidad abren las mismas URL | ✅ código |
| Los pasos y sus omisiones salen de `PASOS` (movidos sin cambios a `useOnboarding`) | ✅ código |
| Seguir se habilita con la misma regla (`obligatorio` y `respondido`) | ✅ código |
| Atrás conserva las respuestas | ✅ código |
| Límites del contador y acotado al escribir iguales | ✅ código |
| Consentimiento de medidas antes de guardar | ✅ código |
| Nombre precargado desde la cuenta | ✅ código |
| Plan listo: mismos valores, Empezar y Cambiar algo iguales | ✅ código |
| Sacudida, odómetro continuo, placas y aplauso | pendiente en dispositivo |
| Botón visible sobre el teclado en Android e iOS | pendiente en dispositivo |

## 12. Parte 3: pestaña Hoy (auditoría previa al rediseño)

Archivo `src/screens/Hoy.tsx`. Ruta `Tabs/Hoy`. Se documenta lo que existe hoy; ese comportamiento no cambia. Las cifras y los orígenes salen de leer el código, no de suponer.

### 12.1 Cabecera y sesión del día

| Dato en pantalla | Origen |
|---|---|
| Saludo | `saludo(perfil.nombre \|\| undefined)` |
| Título | `entrenoHoy ? 'Ya entrenaste hoy' : 'Tu sesión de hoy'`. `entrenoHoy = sesiones.some(s => s.fecha === hoy())`: cualquier sesión guardada hoy, completada o no |
| Objetivo | `nombreGoal(perfil.objetivo)` |
| Duración | `sesion.minutosEstimados`: suma de `duracion(it)` tras el ajuste al tiempo, mínimo 1 |
| N ejercicios | `sesion.items.length`: incluye calentamiento y enfriamiento |
| «Sin saltos» | solo si `perfil.modoSinSaltos` |
| Miniaturas | `sesion.items.slice(0, 6)`, en el orden del motor (calentamiento, principal, enfriamiento). Foto `Foto tipo="ejercicio" id={it.id}`, nombre `it.name` a 2 líneas |
| Sesión | `armarSesion(perfil, semilla, ultimaVezDe)`. `semilla` = FNV-1a de `hoy() + perfil.objetivo`, memorizada solo por `perfil.objetivo`: con la app abierta al cruzar medianoche no se recalcula. Mismo día y mismo perfil dan la misma sesión |

**Aviso «Incluimos algún ejercicio de otro nivel para completar la sesión.»** Sale de `sesion.avisos` y el motor (`engine/session.ts`, bloque principal) lo añade cuando, para algún patrón, hay menos de 6 ejercicios válidos y relajar el nivel amplía el conjunto. Solo se añade el primer aviso del motor: si esa primera relajación incluyó también el espacio, el texto es «Ampliamos el filtro de espacio para completar la sesión.» y no el de nivel. Aparece, por tanto, solo el día en que ocurre. La pantalla añade además «Ajustamos tu sesión a los N minutos que tienes.» cuando `sesion.minutosEstimados < perfil.minPorSesion - 1`. Los tres se muestran como líneas de texto bajo las miniaturas, en ese orden.

| Control | Efecto |
|---|---|
| Empezar (o «Entrenar otra vez» si `entrenoHoy`) | `navigate('Reproductor', { sesion })`. Mismo handler con los dos textos |
| «Hoy no tengo tiempo · sesión de 5 minutos» | `sesionDeRutina('rt_030', perfil, RUTINAS.find(id === 'rt_030'), ultimaVezDe)` → `navigate('Reproductor', { sesion })` |
| Miniatura | no responde al toque (no es tocable) |
| Buscar (⌕) | `navigate('Tabs', { screen: 'Explorar' })`. No enfoca el campo de búsqueda |
| Sin ejercicios seguros (`sesion.items.length === 0`) | La tarjeta muestra «Tu filtro de lesión está activo» y su explicación; único control: «Revisar mis lesiones en Ajustes» → `navigate('Tabs', { screen: 'Yo' })`. Ni Empezar ni la sesión de 5 minutos se muestran |

### 12.2 «Elige tu enfoque» y «¿Prefieres otra rutina?»

**Elige tu enfoque.** Solo si `ejercicios.length > 0`. Origen: `EJERCICIOS` filtrados por `goals` que incluya el objetivo, equipo ⊆ `perfil.equipo` + `ninguno`, `pared`, `silla`, y sin `contra` en común con `perfil.contra`; `slice(semilla % 8, +4)` y aquí se enseñan los 3 primeros. No aplica nivel, espacio ni vetos (a diferencia del motor). Es una fila horizontal libre (sin ajuste al deslizar). Subtítulo `Nivel {e.level}`. Tocar la tarjeta → `navigate('Ejercicio', { id })`. La píldora «Inicio» es decorativa: no tiene toque propio. Los mismos 4 ejercicios alimentan «Ejercicios para ti».

**¿Prefieres otra rutina?** Origen: `estado.rutinasPropias` primero (id con prefijo `mi_`, imagen `imagenRutina(id, imagenId)`, minutos `minutosPropios(items)`), luego `RUTINAS` con `goal === objetivo || min <= 15` y, con `modoSinSaltos`, solo `modo_sin_saltos`; se cortan a 4 en total.

| Control | Efecto |
|---|---|
| Tarjeta | `id` con `mi_` → `navigate('RutinaPropia', { id })`; si no → `navigate('Rutina', { id })` |
| Estrella | `alternarFavorito('rutinas', id)`; estado con `esFavorito('rutinas', id)` |
| «Ver todas» y última tarjeta | `navigate('Tabs', { screen: 'Explorar', merge: true, params: { tab: 'rutinas' } })` |

Hoy la duración sale dos veces en las rutinas del catálogo (subtítulo y etiqueta con `min`); en las propias, subtítulo «Mi rutina» y etiqueta con `min`.

### 12.3 Resto del feed

| Bloque | Origen y controles |
|---|---|
| Fila de 7 días | `ultimos7(sesiones)`: minutos por día; punto si `min > 0`; el día actual se marca con `fecha === hoy()`. Sin controles |
| Racha | `racha.dias` («Día seguido» / «Días seguidos») y `BarrasSemana` con los mismos 7 días. Si `racha.enPausa`: «Tu racha está en pausa, no perdida. Entrena hoy y sigue desde donde estaba.» |
| Explorar todo | Toca la fila → `navigate('Tabs', { screen: 'Explorar' })`. Cifras escritas a mano «190 ejercicios, 30 rutinas, 12 programas»; coinciden con `ESTADISTICAS` (190, 30, 12) |
| Tu programa | Solo si `programaPorId.get(perfil.programaId)`. «Semana {estado.semanaPrograma} de {programa.semanas}». Fila y «Ver» → `navigate('Programa', { id })` |
| Programas | `PROGRAMAS` con los del objetivo primero, sin repetir, 4. Tarjeta → `Programa { id }`; estrella `alternarFavorito('programas', id)`; «Ver todos» y última tarjeta → `Tabs/Explorar { tab: 'programas' }` |
| Ejercicios para ti | Los 4 de `ejercicios`. Tarjeta → `Ejercicio { id }`; estrella `'ejercicios'`; «Ver todos» → `Tabs/Explorar { tab: 'ejercicios' }` |
| Músculos de hoy | Músculos `primary` de `sesion.items` primero, luego el resto, 4. Tarjeta → `Musculo { id }`; sin estrella; «Ver todos» → `Tabs/Explorar { tab: 'musculos' }` |
| Para leer hoy | `TIPS.slice(semilla % 20, +4)`, subtítulo `salaPorId.get(t.sala)?.name`. Tarjeta → `Tip { id }`; estrella `'tips'`; «Ver más» y última tarjeta → `navigate('Tabs', { screen: 'Aprender' })` |
| Estadísticas | Solo si `stats.total > 0`: sesiones, minutos, series (`estadisticas(sesiones)`) y `racha.mejor` |
| Banner | Solo con `ANUNCIOS_ACTIVOS` (hoy `false`): no se dibuja |

### 12.4 Estados y observaciones

| Estado | Hoy |
|---|---|
| Cargando | Hoy no tiene estado de carga propio: `Raiz` muestra el spinner hasta que el estado carga |
| Arrastrar para actualizar | No existe. Los datos son locales: no hay nada que pedir. Lo que se añade (sección 8 del brief) solo vuelve a leer la fecha; el mismo día da la misma sesión |
| Vacío | Sin ejercicios seguros (ver 12.1). No hay estado vacío en los carruseles: cada uno se llena siempre |
| Completado hoy | `entrenoHoy`: título «Ya entrenaste hoy» y botón «Entrenar otra vez»; la sesión y su lista siguen siendo las de hoy |
| Error | No hay ruta de error en Hoy |

Observaciones que **no** se corrigen (funcionalidad congelada):

- `ultimos7` calcula las fechas con `toISOString()` (UTC) y `hoy()` usa la fecha local. Al pasar de las 18:00 en UTC−6 la fila termina un día en el futuro y el día actual queda penúltimo. Es anterior al rediseño; `ultimos7` también alimenta la gráfica de `Yo`.
- «Elige tu enfoque» no aplica los filtros de nivel, espacio y vetos del motor.
- `semilla` se memoriza por `perfil.objetivo`: no se refresca sola al cruzar medianoche.

### 12.5 Registro de la Parte 3

Se rellena al cerrar cada fase. «código» = lectura de código, `tsc` y `lint:color`; nada se ha corrido en dispositivo.

| Punto | Estado |
|---|---|
| Saludo, título, objetivo, duración y N ejercicios de la misma fuente | ✅ código |
| Miniaturas: mismos 6 ejercicios y orden | ✅ código |
| Aviso de «otro nivel» solo cuando `sesion.avisos` lo trae | ✅ código |
| Empezar y «sesión de 5 minutos» abren `Reproductor { sesion }` con la misma sesión | ✅ código |
| Buscar abre `Tabs/Explorar`; sin ejercicios seguros abre `Tabs/Yo` | ✅ código |
| Elige tu enfoque: mismos 3 ejercicios, toque → `Ejercicio { id }` | ✅ código |
| ¿Prefieres otra rutina?: mismas 4, `mi_` → `RutinaPropia`, estrella y «Ver todas» | ✅ código |
| Fila de 7 días, racha, pausa y estadísticas con los mismos datos | ✅ código |
| Programa activo, Programas, Ejercicios, Músculos, Tips: mismas fuentes y rutas | ✅ código |
| Pestañas: las 4 rutas y su salto | ✅ código |
| Cifras de «Explorar todo» = 190, 30, 12 | ✅ código (las cifras salen ahora de `ESTADISTICAS`; se contó el catálogo: 190, 30, 12) |
| Segunda pasada contra el texto completo del brief (encabezado de 80 px, entrada de miniaturas, franja de días, mazo de programas, etc.): mismas fuentes y mismas rutas | ✅ código |
| Barra flotante, encabezado que se encoge, parallax, huella, arrastrar para actualizar | pendiente en dispositivo |
| Barra de pestañas flotante no tapa el último módulo ni el banner | pendiente en dispositivo |
| Rendimiento del scroll en una build de release | pendiente en dispositivo |

Suites tras la fase: `test:ui` 21, `test:player` 63, `test:engine` 74, `test:rutinas` 31, `test:borrarTodo` 14, todas en verde; `tsc` solo con los 4 errores previos de `tests/`; `lint:color` sin fugas; `expo export` de Android sin errores.

### 12.6 Cambios de presentación que tocan un texto mostrado

No cambian ningún dato, filtro ni ruta.

- «Explorar todo»: las cifras salen de `ESTADISTICAS` en vez de estar escritas a mano. Mismos valores hoy.
- Categoría bajo un ejercicio de «Ejercicios para ti»: se muestra el nombre de `CATEGORIAS` («Fuerza») en vez del id («fuerza»).
- Duración de las rutinas y programas del catálogo: se muestra una vez (insignia sobre la foto), ya no también como subtítulo. En las rutinas del catálogo el subtítulo pasa a ser su objetivo (`nombreGoal(r.goal)`); las propias siguen con «Mi rutina».
- La rutina propia muestra una barra con un segmento por ejercicio y una huella de 12 si ya se hizo alguna sesión con ella (`sesiones.some(rutinaId === id)`).
- «Ejercicios para ti»: la ficha muestra el nivel en placas y el mini medidor de evidencia de Explorar (datos del propio ejercicio, `level` y `evidenciaDe`; antes la insignia pequeña); «Para leer hoy» muestra la sala en tipo oración con el ícono de su sala (el de Aprender); la ficha de músculo ya no lleva insignia. *Ajuste posterior a las Partes 5 a 12:* «días seguidos» usa el `SieteDias` de Yo en versión compacta en lugar de barras propias; los datos (`ultimos7`) y el orden de los bloques no cambian.
- Estadísticas: plurales («1 sesión», «1 minuto», «1 serie») y «días seguidos» en minúscula.
- «Elige tu enfoque»: «Nivel N» acompaña a las placas; «Inicio» es un botón y hace lo mismo que tocar la tarjeta.
- El estado «Hecho hoy» añade la etiqueta y la huella de 120 al 10 %; el criterio (`entrenoHoy`) es el mismo.
- Títulos de módulo nuevos: «Tu semana» y «Tu progreso» (antes esos bloques no tenían título).
- Ortografía de títulos (sección 6D.10 del brief), en la capa de presentación por la misma razón que los ejercicios (`name`, `titulo` y `name` de programas son claves de búsqueda de Explorar y Aprender): «Musculo en casa con mancuernas» → «Músculo en casa con mancuernas», «Cuando volver despues de una molestia» → «Cuándo volver después de una molestia» (el dato no es una pregunta, así que solo lleva acentos), «Que dice el unico estudio serio…» → «Qué dice el único estudio serio…», «Traccion en gym» → «Tracción en gym», «Sesion minima de 5 minutos» → «Sesión mínima de 5 minutos», «Mandibula y perfil» → «Mandíbula y perfil», «Vuelta despues de una pausa larga» → «Vuelta después de una pausa larga», «Baja mas lento de lo que subes» → «Baja más lento de lo que subes», «Elige el dia mas dificil de la semana» → «Elige el día más difícil de la semana», salas («Tecnica», «Alimentacion», «Mandibula y rostro») y músculos («Triceps braquial», «Gluteo mayor», «Cuadriceps», «Soleo», «Suelo pelvico»…). Palabras añadidas a `nombresVisibles.ts`: alimentación, básica, cigomáticos, después, día, difícil, digástrico, ilíaco, intrínseca, mandíbula, más, mínima, multífidos, músculo, pélvico, proteína, rápido, sesión, sóleo, técnica, tracción, único, versión. Las descripciones largas de los programas no se tocan.
- «Inicio» en «Elige tu enfoque» ahora es un botón; hace lo mismo que tocar la tarjeta.
- Arrastrar para actualizar: nuevo, sin datos que pedir; solo relee la fecha.

**Ortografía de los nombres de ejercicio (sección 10 del brief).** Se revisaron los 190. 71 llevan una palabra sin tilde. No se tocó el dato: `name` es la clave de búsqueda de Explorar y del editor de rutinas (`name.toLowerCase().includes(...)`), y corregirlo haría que quien escribe «flexion» dejara de encontrarlo. La tilde se pone en la capa de presentación, `src/data/nombresVisibles.ts` (`nombreVisible`), y solo Hoy la usa hoy. Reproductor, Explorar, EditorRutina y los detalles siguen mostrando el nombre del dato. Palabras corregidas (antes → después): abduccion → abducción, activacion → activación, alineacion → alineación, balon → balón, biceps → bíceps, bulgara → búlgara, cajon → cajón, circulos → círculos, cuadriceps → cuádriceps, deglucion → deglución, descompresion → descompresión, dias → días, dinamica → dinámica, elevacion → elevación, eliptica → elíptica, estatica → estática, extension → extensión, flexion → flexión, gluteo → glúteo, isometrica → isométrica, isometrico → isométrico, jalon → jalón, liberacion → liberación, maquina → máquina, menton → mentón, metodo → método, nordico → nórdico, pajaro → pájaro, posicion → posición, presion → presión, progresion → progresión, rapida → rápida, respiracion → respiración, retraccion → retracción, rotacion → rotación, suspension → suspensión, talon → talón, tension → tensión, toracica → torácica, torsion → torsión, triceps → tríceps. Los textos «Ganar musculo» y «Incluimos algun ejercicio…» del brief ya estaban con tilde en el repo (`GOALS` y `engine/session.ts`); las frases habladas de `textos_voz.json` («Flexion diamante…») no se tocaron.

## 13. Parte 4: la sesión de entrenamiento (auditoría previa)

Archivos: `src/screens/Reproductor.tsx` (carga, «¿Listo?», editor, reproductor, salida), `src/session/playerMachine.ts` (máquina pura), `src/session/useSessionPlayer.ts` (reloj y sonidos), `src/screens/Resumen.tsx` y `guardarSesion` en `src/store/store.ts`. Lo que sigue es el comportamiento actual y no cambia. Los errores encontrados están en `docs/BUGS.md` y no se corrigen.

### 13.1 Orden del flujo

1. `Reproductor` recibe `route.params.sesion` (`Sesion`). Mientras `listo` es falso, una pantalla vacía de `color.fondo`. Al montarse llama a `prepararSonido()` (crea los reproductores de tonos) y lo libera al desmontarse.
2. Lee `leerSesionGuardada()` (`forja:sesion_en_curso`). Si hay una guardada con ejercicios, un `Alert` nativo «Sesión sin terminar» con los minutos desde `guardadoEn`: **Empezar de nuevo** (borra la guardada, `listo = true`) o **Continuar** (`restaurar = guardada`, `listo = true`). Si no hay, `listo = true`.
3. «¿Listo?» (`mostrarListo`): solo si no se restaura. Con `restaurar` se salta.
4. Editor «Tu rutina de hoy»: si `!restaurar && !itemsConfirmados && !sesion.origenPropia`. Las rutinas propias lo saltan (ya traen series, tiempo y descanso).
5. `ReproductorActivo` con la lista final (`itemsConfirmados` o la de la sesión).
6. Al llegar a `fin` o al salir: `finalizar` guarda la sesión y hace `navigation.replace('Resumen', { estado, items, resultado, completada, kcal })`.

### 13.2 «¿Listo? Empezamos en un momento»

No se carga nada: dura **3000 ms fijos** (`setTimeout` que arranca cuando `listo` pasa a verdadero) y al vencer pone `mostrarListo = false`. No hay botón ni otro disparador. Esos 3 s son también el margen para que los tonos estén listos antes del primer 3-2-1. Texto: «¿Listo?» (`tipo.display`) y «Empezamos en un momento», con `Aparece`.

### 13.3 «Tu rutina de hoy» (editor)

| Dato | Comportamiento |
|---|---|
| Total | `minutos = max(1, round(Σ duracion(it) / 60))`; `duracion(it) = (trabajo × lados + descansoPlan) × seriesPlan`, con `trabajo = segPlan ?? (repsPlan ?? 10) × 3` y `lados = 2` si el ejercicio es unilateral o `reps_por_lado`. Se recalcula con cada cambio. Hoy dice «N minutos en total» |
| Subtítulo | «Ajusta series, tiempo (o repeticiones si ninguno es por tiempo) y descanso de cada ejercicio antes de empezar.» |
| Series | 1 a 10, paso 1 |
| Tiempo | solo si `segPlan != null`: 5 a 300, paso 5, sufijo « s» |
| Repeticiones | si no es por tiempo: 1 a 50, paso 1 |
| Descanso | 0 a 300, paso 5, sufijo « s» |
| Botones − y + | acotan a `min` y `max`. El número también se escribe: al terminar de editar se acota (no se redondea al paso) y solo se llama `onCambio` si cambió |
| Ajuste de máquina | Solo para ejercicios con equipo de máquina: un campo de texto que guarda con `guardarAjusteMaquina(id, texto)` al terminar de editar (`forja:ajustes_maquina`) |
| Cambiar | `sustituir(perfil, id, idsEnLista)`: primero un sustituto declarado (`substitutes`) válido y no repetido, si no el primero del mismo patrón. Sin alternativa: `Alert` «Sin alternativa» / «No encontramos otro ejercicio que sirva aquí.». Con alternativa: `aItem(nuevo, bloque)` conservando `seriesPlan`; tiempo, repeticiones y descanso vuelven a los del ejercicio nuevo |
| Empezar rutina | Botón al final del contenido, dentro del scroll (no fijo). `onConfirmar(lista)`; no exige haber recorrido la lista |
| Guardado | Los cambios **no** se guardan para la próxima vez: viven en el estado del editor, pasan a la sesión que arranca y a `forja:sesion_en_curso` si se interrumpe. Solo el ajuste de máquina persiste |
| Miniatura | `Clip` de 220 px, no responde al toque |

### 13.4 Reproductor

**Máquina de estados** (`playerMachine.ts`, sin React). Fases: `preparado → trabajo → [cambio_lado → trabajo] → descanso → preparado …`, más `pausa` y `fin`.

- `preparado`: 9 s (`PREPARACION_S`), cuenta atrás; a 0 pasa a `trabajo`.
- `trabajo` por tiempo (`segPlan`): cuenta atrás; a 0 registra la serie (`segundos = segPlan`) y pasa a lo siguiente. Por repeticiones (`segPlan == null`): cuenta hacia arriba sin final y espera «Listo» (`registrar` con `repsPlan`).
- Lo siguiente (`siguiente`): unilateral y lado izquierdo terminado → `cambio_lado` de 5 s con el lado derecho; última serie del último ejercicio → `fin`; tras `trabajo` → `descanso` (`descansoPlan`); tras `descanso` → `preparado` de la serie siguiente o del ejercicio siguiente (unilateral: empieza por la izquierda).
- `descanso`: cuenta atrás; a 0 pasa a lo siguiente. «Ya estoy» (`avanzar`) lo corta.
- `pausa`: guarda `faseAnterior` y detiene el reloj; `reanudar` vuelve a esa fase.
- `deshacer`: vuelve a la foto anterior a la última serie marcada (un solo nivel).
- Acciones de la máquina que la interfaz de hoy no usa: `masDescanso`, `irA`, `sustituido`.

**Reloj.** Un solo `setInterval` de 1000 ms que envía `tick`. Se recrea con cada cambio de fase y no corre en `pausa` ni en `fin`. El tiempo es un entero (`restanteS`): no hay marcas de tiempo. **Segundo plano:** el listener de `AppState` guarda `forja:sesion_en_curso` al salir y, al volver, envía `avanzarReloj(segundos reales)`, que solo ajusta la fase actual (no encadena fases). **App cerrada:** al reabrir el reproductor se ofrece continuar y el estado avanza con el tiempo desde `guardadoEn`. Cada serie marcada también guarda.

**Controles.**

| Control | Efecto |
|---|---|
| Salir | `pausar()` y abre un `Modal` «Guardamos lo que llevas» con cinco motivos (`sin_tiempo`, `muy_dificil`, `muy_facil`, `molestia`, `sin_ganas`): cada uno llama `finalizar(false, motivo)`. «Mejor sigo» cierra y `reanudar()` |
| Pausa / Seguir (cabecera) | Alterna `pausar` y `reanudar`. Con la voz hablando, «Seguir» está deshabilitado. En pausa también hay un botón grande «Seguir» |
| Terminar antes (trabajo por tiempo) | `avanzar()`. Ver BUG-5 |
| Listo (trabajo por repeticiones) | `registrar(repsPlan)` |
| Ya estoy (descanso) | `avanzar()` |
| Omitir este ejercicio | `omitir()`, con háptica Warning. Registra la serie actual como omitida. Ver BUG-6 |
| Deshacer última serie | Solo si hay una foto previa (`puedeDeshacer`) |
| Deshabilitados | Todos los anteriores mientras `hablando`; además Listo, Terminar antes y Ya estoy durante la cuenta final |

**Lo que se ve hoy.** Barra superior de 3 px con chispa: `progreso = series hechas / series totales` (las unilaterales cuentan doble), cambia solo al marcar una serie. «Salir», «N de M» (índice del ejercicio) y «Pausa». Etiqueta de fase, número (`restanteS`, o las repeticiones del plan si el trabajo es por repeticiones), nombre (en descanso, el del siguiente: el mismo si quedan series, si no el siguiente o «Último esfuerzo»), «Serie N de M» y «lado izquierdo/derecho». «Sigue: nombre» si hay siguiente y la fase no es descanso ni fin. `Clip` de 280 px en bucle en `preparado`, `trabajo` y `cambio_lado`; congelado si se pausa desde ahí; oculto en descanso. El fondo cambia de tinte con la fase con un fundido de `anim.lenta`; en la cuenta 3-2-1 el número pulsa y el fondo sube de calor un instante.

**Sonido** (`perfil.sonido`): tono al entrar a trabajo, a cambio de lado, a descanso, al terminar el descanso y al terminar la sesión; 3-2-1 en `preparado`, `cambio_lado` y trabajo por tiempo; un «toque» por segundo en espera; nada en pausa. En descanso no hay 3-2-1 sonoro (sí hablado).
**Voz** (`useVozActiva`): al entrar a `preparado` la sesión se pausa mientras dice el nombre y las claves, y reanuda; las demás fases se anuncian; cuenta final hablada en 3-2-1 (descanso incluido). mp3 si existe; si no, `expo-speech` en es-MX.
**Vibración** (`useHapticosActivos`): Light al registrar una serie que no es omitida, Warning al omitir, Success al terminar.
**Pantalla:** `useKeepAwake()` mientras dura. `useSinAnuncios()`: ningún anuncio. **Orientación:** solo vertical (`orientation: portrait`).
**Accesibilidad hoy:** la etiqueta de fase y el número tienen `accessibilityLiveRegion="polite"`; como el número cambia cada segundo, un lector de pantalla lo anuncia cada segundo.

**Fin.** Al llegar a `fin`: háptica Success y `finalizar(true, null)`. `finalizar` borra `forja:sesion_en_curso`, llama `guardarSesion` con `duracionS = transcurridoS` (no cuenta el tiempo en pausa), las series hechas, `kcal` si hay peso y `rpe: null`, y navega a `Resumen` con `replace`.

### 13.5 Resumen

| Dato | Origen |
|---|---|
| Título | `completada ? 'Sesión completa' : 'Guardamos lo que hiciste'`. Si no está completada, además «Cuenta igual para tu racha. Lo que hiciste, hecho está.» (texto fijo) |
| Días seguidos | `resultado.racha.dias`, devuelto por `guardarSesion`. La racha solo se actualiza si la sesión tiene al menos una serie no omitida (`cuenta = reales.length >= 1`); si no, queda como estaba. «Usaste un día de gracia. Te queda uno este mes.» si `resultado.graciaUsada` |
| Duración | `round(transcurridoS / 60)` min |
| Series | series hechas no omitidas |
| Ejercicios | ids distintos entre las no omitidas |
| Omitidas | solo si hay alguna |
| Gasto aproximado | solo con `perfil.mostrarKcal` y `kcal > 0` |
| Mejor que la vez pasada | reps, segundos o peso mayores que `ultimaVez` |
| Nuevo logro | `resultado.logrosNuevos`, ids que otorga `guardarSesion`: `logro_007dias` (racha ≥ 7), `logro_100sesiones`, `logro_365sesiones`, `logro_030dias` (≥ 20 días distintos en 30), `logro_silenciosa` (≥ 5 completadas con modo sin saltos) y `logro_programa1` («Programa completo»: `sesiones.length >= 1`, ver BUG-1). Nombre y descripción de `logroPorId` |
| Cómo se sintió | Cuatro opciones (3 Suave, 5 Bien, 7 Exigente, 9 Al límite), opcional y de una sola. Es estado local de la pantalla: **no se guarda en ningún sitio** (BUG-3) |
| Cerrar | `navigate('Tabs', { screen: 'Hoy' })` |

### 13.6 Registro de la Parte 4

Se rellena al cerrar cada fase. «código» = lectura de código, `tsc`, suites y `lint:color`; nada se ha corrido en dispositivo.

| Punto | Estado |
|---|---|
| «¿Listo?» dura 3000 ms y no depende de nada más (`DURACION_LISTO_MS`, mismo `setTimeout`) | ✅ código |
| Editor: mismos límites (series 1 a 10, tiempo 5 a 300 de 5 en 5, repeticiones 1 a 50, descanso 0 a 300 de 5 en 5), mismo cálculo del total, Cambiar y Empezar | ✅ código |
| Ajuste de máquina se sigue guardando (`guardarAjusteMaquina`) | ✅ código |
| Reproductor: mismas fases, tiempos y orden (`session/*` sin cambios, `git diff` vacío); mismos handlers de Salir, Pausa, Terminar antes, Omitir, Ya estoy, Listo y Deshacer | ✅ código |
| El anillo lee `restanteS` y no lleva reloj propio | ✅ código |
| Segundo plano y app cerrada igual que antes (`useSessionPlayer` sin cambios) | ✅ código |
| Resumen: mismos datos y mismos casos de logro; «Cómo se sintió» igual (local, BUG-3) | ✅ código |
| El temporizador no se desincroniza con la animación (cronómetro 5 min) | pendiente en dispositivo |
| Partículas de «¿Listo?», barrido de fase, respiración, golpes 3-2-1 y sus hápticas | pendiente en dispositivo |
| 60 fps en Android de gama media y temperatura tras una sesión larga | pendiente en dispositivo |
| Bloquear y desbloquear a mitad de un ejercicio | pendiente en dispositivo |
| Anuncios del lector de pantalla (fase y cada 10 s) | pendiente en dispositivo |

Suites tras la fase: `test:ui` 21, `test:player` 63, `test:engine` 74, `test:rutinas` 31, `test:borrarTodo` 14; `tsc` solo con los 4 errores previos de `tests/`; `lint:color` sin fugas; `expo export` de Android sin errores.

### 13.7 Cambios de presentación que tocan un texto o una háptica

No cambian la máquina, los tiempos, las series ni los datos guardados.

- Háptica de Omitir: Warning → Light (lo pide la Parte 4).
- Háptica al registrar una serie: Light, y Medium si esa serie cierra el ejercicio (el «clank» de la placa). Nuevas: Heavy, Soft y Medium al entrar a Trabaja, Descansa y Prepárate; Rigid en los últimos 3 segundos (también en Descansa); Heavy al asentarse la medalla; hápticas por opción en «Cómo se sintió».
- Lector de pantalla: antes el número anunciaba cada segundo (`accessibilityLiveRegion`); ahora la fase se anuncia al cambiar y el tiempo cada 10 s.
- Mientras la voz lee el ejercicio, la pausa que abre la sesión ya no muestra «En pausa» ni cambia el fondo: conserva el aspecto de Prepárate. La pausa manual muestra «Pausa» sobre un velo.
- En trabajo por repeticiones, el número y el nombre del ejercicio se muestran igual también en pausa (antes en pausa el número mostraba el tiempo transcurrido).
- Editor: «N minutos en total» pasa a «N min en total»; «Repeticiones» y «Tiempo» se ajustan con `Stepper`; en el límite el botón se apaga, sacude y da un aviso (antes se acotaba en silencio); «Empezar rutina» va fijo abajo (antes al final del scroll).
- Reproductor: «Deshacer última serie» y «Omitir este ejercicio» comparten fila; «Sigue: nombre» pasa a una tarjeta con miniatura.
- Textos con tilde: «Ajuste de la máquina» (antes «maquina») y los nombres de ejercicio en el editor, «Sigue» y el resumen, con `nombreVisible` (`Círculos de brazos`, `Respiración nasal consciente`, etc.; el dato no se toca, ver 12.6).

## 14. Parte 5: ficha de ejercicio (auditoría previa)

Archivos: `src/screens/DetalleEjercicio.tsx` (antes `DetalleEjercicio` dentro de `Detalles.tsx`, que sigue con músculo, rutina y programa). Ruta `Ejercicio`, parámetro `{ id }` (`ex_XXXX`); si el id no existe la ficha no dibuja nada. Lo que sigue es el comportamiento actual y no cambia.

### 14.1 Desde dónde se abre

`navigate('Ejercicio', { id })` desde Hoy («Elige tu enfoque» y «Ejercicios para ti»), Explorar (lista y búsqueda), Aprender (ejercicios relacionados de un tip o un mito), Favoritos, Yo (historial), EditorRutina, RutinaPropia y la rutina del catálogo (cada ejercicio de la lista). `push('Ejercicio', { id })` desde un músculo (ejercicios que lo trabajan) y desde la propia ficha (progresiones, regresiones y sustitutos). El reproductor no abre la ficha.

### 14.2 Qué hace cada control

| Control | Efecto |
|---|---|
| Flecha atrás | Era la del encabezado nativo del Stack (título vacío). Ahora es un botón propio que llama `goBack()`; el encabezado nativo se oculta en esta ruta |
| Estrella | `alternarFavorito('ejercicios', id)`; estado con `esFavorito('ejercicios', id)` |
| Tocar un músculo | Sí hace algo: `push('Musculo', { id })`. La última tarjeta («Todos») → `navigate('Tabs', { screen: 'Explorar', merge: true, params: { tab: 'musculos' } })` |
| Tocar una progresión, regresión o sustituto | `push('Ejercicio', { id })`: abre su ficha encima; atrás vuelve a la anterior |
| Botón inferior | «No me lo propongas más» / «Volver a proponérmelo» → `alternarVeto(id)`: añade o quita el id de `perfil.vetos`, que el motor de sesión excluye. Es una acción **secundaria** (era un botón de contorno; en la captura el texto salía cortado) |
| Aviso «Fuera de tu plan» | Solo si alguna contraindicación del ejercicio (`contra`) coincide con `perfil.contra` |

### 14.3 Datos del ejercicio y de dónde salen

`Ejercicio` (`data/catalog.ts`): `name`, `name_en`, `level` (1 a 3), `category`, `unilateral` («Por lado»), `impact` y `noise` (≥ 2 → «Impacto alto» y «Ruidoso»), `desc`, `steps`, `breathing`, `cues` (claves), `errors`, `primary` y `secondary` (músculos), `default` (series, reps o seg, `rest_s`), `equipment`, `space`, `met`, `risk_zones`, `family`, `progressions`, `regressions`, `substitutes`.

- **Evidencia**: `evidenciaDe(e)` devuelve el mapa `afirmación → veredicto` propio del ejercicio o, si no lo tiene, el de su familia (14 de los 190 tienen el suyo), y la nota (`evidence_note`, propia o de la familia). La afirmación es la clave del mapa con los guiones bajos cambiados por espacios (`fuerza_pierna`), en minúscula y sin tildes. Veredictos: `ok` (Comprobado), `parcial`, `mito`. En el catálogo hay de 1 a 4 afirmaciones por ejercicio y los 190 tienen nota; 103 tienen al menos un «mito».
- **Músculos**: `[...primary, ...secondary]`, los primeros 4, con su foto (`musculo`). Bajo la fila, «Principales: …» con los nombres de `primary`.
- **Detalles** (orden y etiquetas): «Series por defecto» (`series × seg s` o `series × reps`), «Descanso» (`rest_s s`), «Equipo» (`nombreEquipo`), «Espacio» (`space` tal cual), «MET», «Zonas de riesgo» (solo si hay) y «Familia» (solo si hay).
- **Medio**: `Clip` (190 clips `.mp4` en bucle, sin audio); sin clip, la foto; sin nada, no se dibuja nada.

### 14.4 Secciones opcionales

Datos reales de los 190: sin regresiones 84, sin sustitutos 4, sin progresiones 111, sin zonas de riesgo 21. Todos tienen pasos, claves, errores, respiración, nombre en inglés, afirmaciones de evidencia y nota. Una lista vacía de progresiones, regresiones o sustitutos no dibuja la sección; una sin zonas de riesgo o sin familia no dibuja la fila. Antes, «Qué dice la evidencia» se dibujaba siempre, aunque estuviera vacía; ahora solo si hay afirmaciones o nota (no ocurre con los datos actuales).

**La ficha tiene tres listas relacionadas, no dos**: además de «Regresiones» y «Sustitutos» está «Progresiones» (el brief no la menciona; se conserva con el mismo diseño).

### 14.5 Registro de la Parte 5

| Punto | Estado |
|---|---|
| Atrás, favorito, músculos, regresiones, sustitutos y botón inferior hacen lo mismo | ✅ código |
| Todos los datos y el mismo orden de secciones (evidencia, cómo se hace, claves, errores, músculos, detalles, progresiones, regresiones, sustitutos) | ✅ código |
| Ejercicios sin alguna sección opcional no dejan huecos | ✅ código |
| Los 190 ejercicios se abren sin error (datos leídos: ninguno sin evidencia, nota, pasos, claves ni errores) | ✅ datos |
| Abrir una regresión y volver (`push` y `goBack`) | ✅ código |
| Hero, colapso, estiramiento, medidor, insignias con háptica, línea de tiempo, respiración, trazos, fichas y rejilla | pendiente en dispositivo |
| Probar al menos 5 ejercicios (uno con «mito», uno sin regresiones, uno con músculos de nombre largo) | pendiente en dispositivo |
| 60 fps al hacer scroll en Android de gama media | pendiente en dispositivo |
| Lector de pantalla: afirmación con veredicto, pasos en orden, detalles con etiqueta | pendiente en dispositivo |

### 14.6 Cambios de presentación que tocan un texto

No cambian ningún dato ni ruta.

- Nombre, descripción, pasos, claves, errores, respiración, afirmaciones y nota se muestran con tildes y con la primera letra en mayúscula (`textoVisible`, `utils/presentacion.ts`); el dato no se toca (es clave de búsqueda o identificador). La afirmación `correccion_asimetrias` se muestra «Corrección asimetrías»: es una clave, no un texto de visualización, así que se corrigen las tildes sin añadir palabras.
- La categoría sale del nombre de `CATEGORIAS` («Fuerza», «Técnica de carrera») en vez del id; «Espacio» sale con mayúscula («Mínimo», «Amplio»); las zonas de riesgo, como frase («Rodilla, cadera»; `atm` → «ATM», `muneca` → «muñeca»).
- Se añaden líneas de ayuda bajo los encabezados: «Una versión más fácil» (Regresiones), «Si no puedes hacer este» (Sustitutos) y, por coherencia, «Una versión más difícil» (Progresiones). Son texto nuevo; se quitan en una línea si se prefiere.
- El resumen bajo el medidor («3 comprobados, 1 parcial») sale solo de los conteos; no hay calificación ni porcentaje nuevos.
- Las claves ya no son chips y los errores llevan una X en lugar de «✕».
- La palabra «Principal» marca en cada ficha los músculos de `primary`; antes solo salía la fila «Principales».

**Ortografía de los textos de los 190 ejercicios.** El catálogo está escrito sin tildes (solo hay una palabra acentuada, «revés», y las ñ). Se inventariaron las 1 925 palabras distintas de descripción, pasos, claves, errores, respiración, afirmaciones, notas y nombres de familias y músculos, y `src/data/nombresVisibles.ts` corrige al mostrar las que no son ambiguas (264 palabras, entre ellas: más, también, después, así, atrás, según, músculo, glúteo, cuádriceps, tríceps, bíceps, talón, muñeca, respiración, posición, flexión, extensión, tensión, rotación, técnica, isométrica, rápida, máquina, círculos, búlgara, mantén, siéntate, sujétate, verás). **No se corrigen** las palabras cuyo significado cambia con la tilde: esta/está, si/sí, aun/aún, solo, continua/continúa, perdida/pérdida, como, cuando, que; en los textos largos pueden quedar sin tilde. Arreglarlas del todo exige corregir el dato con una revisión humana y hacer la búsqueda insensible a tildes.

## 15. Parte 6: pestaña Explorar (auditoría previa)

Archivo: `src/screens/Explorar.tsx`. Pestaña `Explorar` con parámetro opcional `{ tab }` (`ejercicios`, `rutinas`, `programas` o `musculos`) que llega desde Hoy («Ver todas»), Favoritos, la ficha de ejercicio y las fichas de músculo y programa. Lo que sigue es el comportamiento previo al rediseño y no cambia.

### 15.1 Búsqueda

- Un solo campo. Filtra en vivo con cada tecla; no hay botón de enviar ni abre otra pantalla. Compara `q.trim().toLowerCase()` con `includes`, sin quitar tildes.
- Qué busca según el segmento: Ejercicios: `name`, `name_en` y `aliases`. Rutinas: `name`. Programas: `name`. Músculos: `name` y `group`.
- El texto se conserva al cambiar de segmento y al salir de la pestaña (el estado vive en la pantalla, que sigue montada).
- No hay botón «Cancelar». Lo único parecido es la X nativa de iOS (`clearButtonMode="while-editing"`); en Android no hay ninguna.
- Sin resultados: Ejercicios muestra «Nada con esos filtros. Prueba a quitar alguno.»; Rutinas, «Sin rutinas con ese filtro.». Programas y Músculos no muestran nada. Ninguno ofrece una acción (no existe «limpiar filtros»).

### 15.2 Segmentos

- Ejercicios, Rutinas, Programas y Músculos: cuatro chips en una fila con scroll horizontal. Se cambian **solo con el toque**: no hay paginador ni deslizamiento. Cada segmento monta su propia `FlatList` y desmonta las demás. También cambian con el parámetro `tab`.
- Listas: Ejercicios (`EJERCICIOS` filtrada), Rutinas (`RUTINAS` filtrada, precedida por «Crear mi rutina» y por «Mis rutinas» si las hay), Programas (`PROGRAMAS` filtrada) y Músculos (`MUSCULOS` filtrada, 3 columnas).
- Filas de filtro por segmento: Ejercicios lleva categoría, objetivo y «Lo que puedo hacer / Catálogo completo»; Rutinas y Programas, solo objetivo; Músculos, ninguna.
- Toda la cabecera (título, buscador, chips, contador) está **fuera** de la lista: ya es fija y no hace scroll con ella.

### 15.3 Filtros

- **Objetivo** (`goal`): selección única, un solo estado para los tres segmentos. Tocar el elegido lo quita; «Cualquier objetivo» equivale a ninguno. Se combina con la búsqueda: Ejercicios (`e.goals.includes(goal)`), Rutinas (`r.goal === goal`) y Programas (`p.goal === goal`). No afecta a Músculos ni a «Mis rutinas».
- **Categoría** (`cat`, solo Ejercicios): selección única; «Todo» la quita; tocar la elegida no la quita.
- **Lo que puedo hacer / Catálogo completo** (`soloMios`, solo Ejercicios): por defecto «Lo que puedo hacer». Activo excluye los ejercicios cuyo `contra` coincide con `perfil.contra`, los que piden un equipo que no está en `perfil.equipo` (más `ninguno`, `pared` y `silla`) y, con `modoSinSaltos`, los de `impact >= 2` o `noise >= 2`.
- Todos se combinan entre sí (Y lógico) y con la búsqueda.

### 15.4 Contador

`cuantos` es el largo de la lista filtrada del segmento activo y se escribe `${cuantos} ${tab}` («30 rutinas», «69 ejercicios»; el id del segmento, así que hoy sale «musculos» sin tilde y «1 rutinas» con uno). **No** incluye «Mis rutinas». A su derecha van «Lo que puedo hacer» y «Catálogo completo» (solo Ejercicios) y, si el segmento está descargado (`estado.descargas.includes(tab)`), «Sin conexión ✓».

### 15.5 Qué abre cada cosa

| Elemento | Acción |
|---|---|
| «Crear mi rutina» | `navigate('EditorRutina')` sin parámetros |
| Fila de ejercicio | `navigate('Ejercicio', { id })`; estrella: `alternarFavorito('ejercicios', id)` |
| Tarjeta de rutina | `navigate('Rutina', { id })`; estrella: `alternarFavorito('rutinas', id)` |
| Fila de «Mis rutinas» | `navigate('RutinaPropia', { id })`; lápiz: `navigate('EditorRutina', { id })` |
| Tarjeta de programa | `navigate('Programa', { id })`; estrella: `alternarFavorito('programas', id)` |
| Músculo | `navigate('Musculo', { id })` (sin favorito) |

Datos de cada tarjeta: ejercicio, `nombreEquipo(equipment)` y `level`. Rutina, `min`, `nombreGoal(goal)`, `level` y «Silenciosa» si `modo_sin_saltos`. Programa, `desc` (2 líneas), `semanas`, `dias_semana` y `min_sesion`. Rutina propia, `nombre`, foto `imagenRutina(id, imagenId)`, `items.length` y `minutosPropios(items)`.

Orden: el de los datos, sin ordenar. No hay paginación, ni carga incremental, ni arrastrar para actualizar. En «Mis rutinas» no hay eliminar ni «ver todas» (borrar vive en la propia rutina).

### 15.6 Lo que existe pero no se ve hoy

`MuroCategoria` e `Intersticial` (desbloqueo por anuncio) están conectados al segmento, pero `ANUNCIOS_ACTIVOS = false`: el muro nunca se dibuja y «Sin conexión ✓» solo saldría si `estado.descargas` ya lo trajera. Se conservan tal cual. No existe ningún estado de carga: los datos son locales, y lo único que carga es cada foto (con su esqueleto).

### 15.7 Registro de la Parte 6

«código» = lectura de código, `tsc`, `lint:color` y los cinco conjuntos de pruebas; nada se ha corrido en dispositivo.

| Punto | Estado |
|---|---|
| Los filtros de Ejercicios, Rutinas, Programas y Músculos (búsqueda, objetivo, categoría, «Lo que puedo hacer») son el mismo código, copiado sin cambios | ✅ código |
| El contador es la misma cuenta (`length` de la lista filtrada; no incluye «Mis rutinas») | ✅ código |
| «Crear mi rutina», fila de ejercicio, tarjeta de rutina, fila de «Mis rutinas», lápiz, tarjeta de programa y músculo abren lo mismo y con los mismos parámetros | ✅ código |
| Favoritos de ejercicios, rutinas y programas: mismas llamadas a `alternarFavorito` y a `esFavorito` | ✅ código |
| El parámetro `tab` sigue cambiando de segmento (y conserva el error BUG-9, ver 15.9) | ✅ código |
| `MuroCategoria`, `Intersticial` y «Sin conexión» siguen conectados | ✅ código |
| Ningún dato, ni el almacén, ni el motor, ni `catalog.ts` se tocaron | ✅ código |
| Cabecera fija, título que se colapsa, buscador con placeholder que rueda, segmentos con barra, chips con relleno desde el toque, interruptor, plegado de filtros | pendiente en dispositivo |
| Contador que rueda, entrada escalonada de tarjetas, reacomodo de filas, cambio de segmento con desplazamiento | pendiente en dispositivo |
| Fila propia nueva o editada al volver del editor (entrada, placas, brillo, contador del grupo) | pendiente en dispositivo |
| 60 fps al hacer scroll rápido por los 190 ejercicios en Android de gama media | pendiente en dispositivo |
| Parallax de la foto de la tarjeta de rutina (12 px, con `measure` en el hilo de UI); si no sostiene 60 fps, `PARALLAX_PX` = 0 en `TarjetaRutina.tsx` lo apaga | pendiente en dispositivo |
| Lector de pantalla: segmento seleccionado, filtros activos, número de resultados y filas con equipo, nivel y evidencia | pendiente en dispositivo |

Suites tras la fase: `test:ui` 21, `test:player` 63, `test:engine` 74, `test:rutinas` 31, `test:borrarTodo` 14, todas en verde; `tsc` solo con los 4 errores previos de `tests/`; `lint:color` sin fugas; `expo export` de Android sin errores.

### 15.8 Cambios de presentación que tocan un texto o una acción visible

No cambian ningún dato ni ruta.

- **Tildes**: se muestran con `nombreVisible` los nombres de ejercicios («Sentadilla isométrica en pared», «Estocada estática»), rutinas y programas, y las descripciones de programas (se añadieron «sección», «excéntricas» y «monotemático» al mapa). Equipo: `textoDeEquipo` («Sin equipo», «Pared, silla o escalón»: la primera palabra con mayúscula y las demás en minúscula). Los objetivos del filtro ya venían con tilde («Ganar músculo», «Mandíbula y rostro», «Condición física»). El contador dice «músculos» (antes el id sin tilde, «musculos»).
- **Plural**: «1 rutina», «1 ejercicio», «1 semana», «1 día/sem» (`utils/plural.ts`). «Mis rutinas (1)» pasa a «Mis rutinas» con el 1 aparte.
- **Etiquetas de segundo nivel**: «nivel 1» pasa a las placas más «Nivel 1» con mayúscula; «Silenciosa» ya no es un chip debajo, sino una etiqueta sobre la foto de la rutina. «Sin conexión ✓» pasa a un icono de palomita más «Sin conexión».
- **Duración**: en las rutinas del catálogo sale una sola vez (sobre la foto), no otra vez en la etiqueta de abajo.
- **Programas**: se conserva la descripción de 2 líneas y los tres números (semanas, días por semana y minutos por sesión), ahora en Big Shoulders con su unidad aparte.
- **Sin resultados**: Rutinas pasa de «Sin rutinas con ese filtro.» a «Sin rutinas con ese filtro. Prueba con otro objetivo o borra la búsqueda.» y Programas y Músculos, que no mostraban nada, dicen ahora «Sin programas con ese filtro. Prueba con otro objetivo o borra la búsqueda.» y «Ningún músculo coincide. Prueba con otra palabra.». Ejercicios conserva su texto.
- **X para borrar la búsqueda**: antes solo existía la de iOS (nativa); ahora es propia y sale también en Android. No hay botón «Cancelar» porque nunca lo hubo.
- **Filas de filtro con el teclado abierto**: ahora el primer toque en un chip funciona (`keyboardShouldPersistTaps="handled"`); antes el primero solo cerraba el teclado.
- **Interruptor**: «Lo que puedo hacer / Catálogo completo» son ahora un control de dos posiciones, en la línea del contador y a la derecha. En 360 px las frases enteras no caben junto al contador, así que se ve «Puedo hacer» / «Catálogo» y el lector de pantalla sigue oyendo las frases completas. Escribe el mismo `soloMios`.
- **Mini medidor**: junto al nivel, en la segunda línea de cada ejercicio. Para que quepa en 360 px, el equipo se corta con puntos suspensivos cuando es largo; la frase entera sigue en la etiqueta del lector de pantalla.
- **Resumen de filtros**: al plegar, las filas de categoría y objetivo se van y queda una línea de resumen entre los segmentos y el contador (ya no comparte línea con el contador).

### 15.9 Errores detectados (no corregidos)

Detalle y propuesta en `docs/BUGS.md`.

- **BUG-8.** La búsqueda no encuentra lo que se ve. Los nombres se muestran con tilde («Flexión»), pero el dato no la trae y la búsqueda compara sin quitar tildes: escribir «flexión» no devuelve nada; «flexion» sí. Lo destapa la corrección de ortografía en pantalla (Partes 3 a 6).
- **BUG-9.** «Ver todas» no siempre cambia de segmento: si Hoy ya pasó `{ tab: 'rutinas' }`, el usuario cambia a mano de segmento y vuelve a Hoy a pulsar lo mismo, el parámetro no cambia y la pestaña se queda donde está.
- **Observación, no error:** «Mis rutinas» no se filtra con la búsqueda ni con el objetivo, y no entra en el contador («30 rutinas»). Se conserva tal cual.


## 16. Parte 7: «Crear rutina» (auditoría previa)

Archivo: `src/screens/EditorRutina.tsx`. Ruta `EditorRutina` del Stack (`title: ''`, animación `slide_from_bottom`, sin la entrada de escala de `screenLayout`), con el encabezado nativo (flecha atrás). Lo que sigue es el comportamiento previo al rediseño y no cambia.

### 16.1 Desde dónde se abre y para qué sirve

- **Crear** (sin parámetros): «Crear mi rutina» de Explorar (`navigate('EditorRutina')`). El borrador vive en memoria (`nuevaRutinaPropia({ objetivo: perfil.objetivo })`); no se guarda hasta aceptar.
- **Editar** (`{ id }`): el lápiz de una fila de «Mis rutinas» (Explorar), «Editar» en `RutinaPropia` y `duplicarYEditar` de `DetalleRutina`. Este último **guarda antes** una copia de la rutina del catálogo (`«{nombre} (copia)»`, `origen` = id del catálogo) y abre el editor con el id de esa copia (ver 16.9).
- En edición el título dice «Editar rutina» y el botón «Guardar cambios»; en creación, «Crear rutina» en los dos.

### 16.2 Nombre

Un `TextInput` de una línea, `maxLength={48}`, placeholder «Nombre de la rutina». No hay mínimo mientras se escribe; al guardar se hace `trim()`. Es obligatorio: si está vacío (o solo espacios) al tocar «Crear rutina» sale una alerta («Ponle nombre» / «Así la reconoces después en tu lista.») y no se guarda. No se comprueba que sea único.

### 16.3 Objetivo

Selección única entre los 8 de `GOALS`. Tocar el elegido no lo quita (no hay «cualquiera»). Valor de partida: el objetivo del perfil en una rutina nueva y el guardado en una editada.

### 16.4 Resumen

- **Ejercicios**: `r.items.length` (cuenta también un id que ya no exista en el catálogo).
- **Series**: suma de `series` de todos los ejercicios.
- **Minutos**: `minutosPropios(items)` (`engine/session.ts`, la fórmula del reproductor). Por ejercicio: `trabajo = seg ?? reps × 3`; `lados = 2` si es unilateral o `reps_por_lado`, si no 1; suma `(trabajo × lados + descansoS) × series`. Se redondea el total de segundos a minutos con `Math.max(1, Math.round(total / 60))`: **mínimo artificial de 1**, por eso con 0 ejercicios dice «1 minutos» (BUG-10). Los ids desconocidos se ignoran. Es la misma función que usan Hoy, Explorar y `RutinaPropia`.
- Los avisos de `revisarPropia` (lesión, equipo, modo sin saltos, sin movilidad) salen como notas bajo el resumen y **nunca bloquean**.

### 16.5 «Agregar ejercicio»

Abre `SelectorEjercicio`, un `Modal` a pantalla completa (`slide`) definido en el mismo archivo: buscador (`name` y `name_en`, sin tildes ni alias), categoría (una, «Todo»), «Solo con mi equipo» (por defecto) o «Catálogo completo», un contador y la lista. Tocar una fila llama a `onElegir` (sin navegación: el ejercicio vuelve por callback), que cierra el modal y hace `anadir`. Los que ya están salen al 50 % con «ya está» y sin acción; si se repitiera uno, `anadir` lo ignora. El nuevo entra **al final** con `itemPropioPorDefecto`: series `default.series ?? 3`, reps `default.reps ?? 10` (o `seg` si el ejercicio trae `default.seg`) y descanso `default.rest_s ?? 45`. El selector no filtra por lesiones ni por modo sin saltos (para eso están los avisos).

### 16.6 Tarjeta de ejercicio

| Control | Límites y salto |
|---|---|
| Series | 1 a 10, de 1 en 1 |
| Reps | 1 a 50, de 1 en 1 |
| Segundos (si se mide por tiempo) | 5 a 300, de 5 en 5 |
| Descanso | 0 a 240, de 5 en 5 |

- Cada valor también se puede escribir; al terminar se acota a su mínimo y máximo. En el límite el botón no hace nada (sin aviso).
- **Medir por tiempo / por reps**: el chip cambia entre `seg` y `reps` del ejercicio: a tiempo, `{ reps: undefined, seg: default.seg ?? 30 }`; a reps, `{ seg: undefined, reps: default.reps ?? 10 }`. La columna del medio pasa de «Reps» a «Segundos» y viceversa; series y descanso no cambian.
- **↑ ↓**: intercambian con el vecino; en el primero o el último no hacen nada y **no se deshabilitan**.
- **Quitar**: sin confirmación y sin deshacer; el ejercicio sale al instante.
- Tocar el nombre abre `Ejercicio { id }`. El equipo se muestra con «· por lado» si es unilateral.

### 16.7 «Cancelar» y atrás

«Cancelar» es `navigation.goBack()`. Un listener `beforeRemove` (cubre también la flecha, el gesto y el botón atrás de Android) compara `JSON.stringify(rutina)` con la foto del arranque: sin cambios sale directo; con cambios muestra una alerta «Descartar cambios» («Tienes cambios sin guardar en esta rutina. Si sales ahora se pierden.») con «Seguir editando» y «Descartar». Tras guardar, la salida es libre.

### 16.8 «Crear rutina» / «Guardar cambios»

El botón **nunca se deshabilita**; valida al tocarlo, en este orden: sin nombre → alerta «Ponle nombre»; sin ejercicios → alerta «Falta contenido» («Agrega al menos un ejercicio.»). Con las dos cosas, `guardarRutinaPropia({ ...r, nombre: trim })` (nueva: se añade a `rutinasPropias`; existente: se reemplaza y `editada = hoy()`), marca la salida libre y `navigation.goBack()`: vuelve a la pantalla de origen sin ningún parámetro.

### 16.9 Cosas que existen pero no se ven

- `DetalleRutina.duplicarYEditar` guarda la copia **antes** de abrir el editor. Aunque el usuario cancele, la copia queda en «Mis rutinas». El comentario del editor («se guarda solo al tocar Guardar») no vale para ese camino. Se conserva tal cual (observación 16.12).
- Una rutina copiada del catálogo podría traer el mismo ejercicio dos veces; el editor lo permite (solo `anadir` lo impide) y su clave de lista incluye el índice.

### 16.10 Registro de la Parte 7

«código» = lectura de código, `tsc`, `lint:color`, los cinco conjuntos de pruebas y `expo export` de Android; nada se ha corrido en dispositivo.

| Punto | Estado |
|---|---|
| Nombre (48 caracteres, `trim`, obligatorio), objetivo (selección única, sin quitar), agregar (`anadir`, sin repetidos, valores por defecto), quitar (sin confirmación), ↑ ↓ (sin deshabilitar), medir por tiempo (mismos campos `seg` y `reps`) y salida con confirmación al haber cambios son el mismo código | ✅ código |
| Límites y saltos: series 1 a 10, reps 1 a 50, segundos 5 a 300 de 5 en 5, descanso 0 a 240 de 5 en 5; los valores se siguen pudiendo escribir y se acotan | ✅ código |
| Los tres números del resumen salen de las mismas cuentas (`items.length`, suma de `series`, `minutosPropios`) | ✅ código |
| Guardar: mismas dos validaciones y en el mismo orden, mismo `guardarRutinaPropia`, mismo `goBack()`; el botón sigue sin deshabilitarse | ✅ código |
| Editar una rutina propia (título «Editar rutina», «Guardar cambios») y la copia desde el catálogo | ✅ código |
| Nombre como título, línea que se dibuja, guion que parpadea, error en línea con sacudida | pendiente en dispositivo |
| Barra: placas que entran y salen, vibración, reordenar, «+N», levantamiento al crear, versión compacta pegajosa | pendiente en dispositivo |
| Tarjeta: `Stepper` compacto, interruptor, giro de la columna, entrada, salida y reordenar con desplazamiento, scroll hasta la tarjeta, brillo | pendiente en dispositivo |
| Hoja de descartar, aplauso al crear, pulso del «+» con la lista vacía | pendiente en dispositivo |
| 60 fps al agregar y reordenar en Android de gama media | pendiente en dispositivo |
| Lector de pantalla: «Ejercicio agregado, N ejercicios», «Ejercicio movido a posición N», etiqueta de la barra con el resumen y placas ocultas | pendiente en dispositivo |

### 16.11 Cambios de presentación que tocan un texto o una acción visible

No cambian ningún dato ni ruta.

- **Errores en línea.** Las dos alertas de validación («Ponle nombre», «Falta contenido») ya no son alertas del sistema: son el mismo texto en rojo bajo el campo de nombre y bajo el título «Ejercicios», con la sacudida de 6 px y la háptica de error de la pantalla de acceso, y la pantalla se desplaza hasta ellos. Se validan en el mismo orden y siguen bloqueando el guardado.
- **Descartar cambios.** La alerta es una hoja inferior con el mismo texto y las mismas dos salidas («Descartar», «Seguir editando»). El botón atrás de Android con la hoja abierta es «Seguir editando». La confirmación sigue saltando en los mismos casos (`beforeRemove` con cambios).
- **Plurales.** «1 ejercicio», «1 serie», «1 minuto» (`utils/plural.ts`, solo en la vista; ver BUG-10 para el «1 minutos» del cálculo).
- **Ejercicio recién elegido.** Entra 300 ms después de elegirlo (cuando el selector ya se cerró) y la lista se desplaza hasta él.
- **Etiquetas del lector de pantalla.** Los botones ↑ ↓ nombran el ejercicio («Mover Sentadilla arriba») y su nombre es un botón «Ver {nombre}»; la barra lleva el resumen completo y sus placas no se leen. Se anuncian «Ejercicio agregado, N ejercicios», «Ejercicio quitado, N ejercicios» y «Ejercicio movido a posición N».
- **Medir por tiempo.** Ya no es un chip que cambia de texto («Medir por reps» / «Medir por tiempo»): es un interruptor con la etiqueta fija «Medir por tiempo», activado cuando el ejercicio se mide por segundos. Escribe los mismos campos.
- **Quitar** no pide confirmación ni se puede deshacer (como antes), así que no hay hoja ni aviso de deshacer.

### 16.12 Observaciones (no son errores del rediseño)

- **BUG-10** y **BUG-11** (`docs/BUGS.md`).
- El selector de ejercicios no filtra por lesiones ni modo sin saltos (para eso están los avisos) y su búsqueda solo mira `name` y `name_en`, sin alias ni tildes: se suma a BUG-8.
- El descanso llega a 240 s aquí y a 300 s en «Tu rutina de hoy» (Parte 4): son editores distintos con límites distintos; se conservan.


## 17. Parte 8: detalle de rutina (auditoría previa)

Dos pantallas hermanas del Stack, las dos con el encabezado nativo (`title: ''`, flecha atrás): `Rutina { id }` (`DetalleRutina`, en `src/screens/Detalles.tsx`, datos de `RUTINAS`) y `RutinaPropia { id }` (`src/screens/RutinaPropia.tsx`, datos de `estado.rutinasPropias`). Lo que sigue es el comportamiento previo al rediseño y no cambia.

### 17.1 Desde dónde se abre

| Origen | Destino |
|---|---|
| Hoy (rutina rápida y «¿Prefieres otra rutina?») | `r.id.startsWith('mi_') ? 'RutinaPropia' : 'Rutina'` |
| Explorar: tarjeta del catálogo / fila de «Mis rutinas» | `Rutina { id }` / `RutinaPropia { id }` |
| Favoritos | la misma regla `mi_` |
| Aprender (rutinas relacionadas de un tip) y Programa (rutinas de cada fase) | `Rutina { id }` |
| «Duplicar» de una propia | `replace('RutinaPropia', { id: copia.id })` |

### 17.2 Qué hay arriba de los bloques

- **Foto** `Foto` de 220 a todo el ancho (`tipo="rutina"`, `mostrarRuta`) con el **favorito** de 44 sobre la foto, arriba a la derecha (`alternarFavorito('rutinas', id)`). No hay más acciones arriba que la flecha atrás nativa.
- **Título** (`h1`) y una fila de chips. Catálogo: objetivo (marcado), «N min», «Nivel N» y «Silenciosa» si `modo_sin_saltos`. Propia: objetivo, «N min» (`minutosPropios`), «N ejercicios» y «N series».
- Después, la **nota** de la rutina si trae (`r.nota`; 11 de las 30) y, en la propia, los avisos de `revisarPropia` como `Nota` de cuidado («Revisa»).
- Solo la propia: la etiqueta «MÍA» sobre la foto, el lápiz de editar junto al nombre (`navigate('EditorRutina', { id })`) y «Creada el … · editada el …». Su foto es `imagenRutina(id, imagenId)`: siempre una de las 30 del catálogo, nunca falta.

### 17.3 Estructura de datos

- **Catálogo:** `Rutina.bloques: { tipo, min, vueltas?, items: string[] }[]`. Los 30 tienen `calentamiento`, `principal` y `enfriamiento`, salvo cinco (rt_017, rt_027, rt_028, rt_029, rt_030) que solo traen un bloque `principal`. **Vueltas** las traen 7 bloques principales (rt_001 a rt_004 y rt_012: 3; rt_011 y rt_030: 2); los otros 23 principales no traen. Todos los bloques traen `min` y su suma es siempre `r.min`. La prescripción de cada ejercicio es la de `e.default` («series × seg s» si trae `seg`, si no «series × reps»); la rutina no guarda prescripción propia. Los ids que no existen en el catálogo se omiten.
- **Propia:** `items: ItemPropio[]` planos (`ejercicioId`, `series`, `reps` o `seg`, `descansoS`). Sin bloques ni vueltas; lista numerada «Ejercicios» con «series × reps|seg [por lado] · N s de descanso».

### 17.4 Tocar un ejercicio

`navigate('Ejercicio', { id })`, la ficha de la Parte 5, en las dos pantallas. La fila no tiene otra acción.

### 17.5 Nota de gasto calórico

Solo en la ficha del catálogo. Condición: `estado.perfil.mostrarKcal` (Yo → «Estimación de calorías»; activo por defecto). Valor: `r.kcal_aprox_70kg` tal cual, sin escalar al peso del usuario (la frase dice «para 70 kg»). Texto: «Gasto aproximado para 70 kg: ~N kcal. Es una estimación poblacional, no una medida de tu cuerpo.» La ficha de una propia no muestra calorías.

### 17.6 «Duplicar y editar», «Duplicar» y «Borrar rutina»

- **Catálogo → «Duplicar y editar».** Aplana los bloques (todos los `items`, en el orden de los bloques), descarta ids desconocidos, convierte cada uno con `itemPropioPorDefecto` (series, reps o seg y descanso por defecto del ejercicio), crea `nuevaRutinaPropia({ nombre: «{nombre} (copia)», objetivo: r.goal, items, origen: r.id })` (foto al azar), la **guarda ya** (`guardarRutinaPropia`, ver BUG-11) y abre `EditorRutina { id: copia.id }`. La copia pierde los bloques y las vueltas.
- **Propia → «Duplicar».** Copia nombre («{nombre} (copia)»), objetivo, ítems y `origen: r.id`, la guarda y hace `replace('RutinaPropia', { id: copia.id })`.
- **Propia → «Borrar rutina».** Alerta «Borrar rutina» / «Se elimina "{nombre}". No se puede deshacer.» → `borrarRutinaPropia(id)` (y la quita de favoritos) + `goBack()`.

### 17.7 «Empezar»

- **Catálogo** («Empezar esta rutina»): `sesionDeRutina(r.id, perfil, r, ultimaVezDe)` → `navigate('Reproductor', { sesion })`. La sesión recorre los bloques en orden, **una sola vez cada ejercicio** (no repite el bloque por sus vueltas: BUG-12), cambia por su sustituto los que cargan una zona lesionada (aviso «Cambiamos N ejercicio(s) por tus lesiones declaradas») y escala las kcal al peso si lo hay.
- **Propia** («Empezar»): `sesionDePropia(r, perfil, ultimaVezDe)`; el bloque sale de la categoría (movilidad → calentamiento, estiramiento → enfriamiento, el resto principal).

### 17.8 Estados

Sin estados de carga (datos locales; solo cada foto, con su esqueleto). `Rutina` con un id inexistente muestra una pantalla vacía; `RutinaPropia` inexistente, «Esta rutina ya no existe.» (también unos instantes tras borrarla, antes de que se cierre la pantalla).

### 17.9 Registro de la Parte 8

«código» = lectura de código, `tsc`, `lint:color` y las suites; nada se ha corrido en dispositivo.

| Punto | Estado |
|---|---|
| Mismos bloques, mismos ejercicios, mismo orden y mismas prescripciones (catálogo: `e.default`; propia: sus `items`) | ✅ código |
| Tocar un ejercicio abre la misma ficha: `navigate('Ejercicio', { id })` | ✅ código |
| La nota de calorías: mismo valor (`kcal_aprox_70kg`), solo con `mostrarKcal` y solo en el catálogo | ✅ código |
| «Duplicar y editar» y «Duplicar» hacen la misma copia, la guardan igual y navegan igual; solo se añade el parámetro `desdeCopia` al abrir el editor | ✅ código |
| «Empezar esta rutina» / «Empezar»: la misma sesión (`sesionDeRutina` / `sesionDePropia`) y la misma ruta | ✅ código |
| Catálogo y propias: lápiz, favorito, «Duplicar», «Borrar rutina» y avisos con las mismas acciones | ✅ código |
| Tramos del perfil: suman 1 y ninguno baja del piso en las 30 rutinas; 3 vueltas dan 3 jorobas, 1 vuelta una y una rutina sin bloques una meseta; resumen del lector de pantalla | ✅ prueba (`test:detalleRutina`, 24) |
| Hero, barra superior, entrada de las filas, riel que se llena, nodos, flecha que gira | pendiente en dispositivo |
| Perfil que se dibuja, punto que sigue el scroll, tramo resaltado y copia compacta pegajosa | pendiente en dispositivo |
| «Duplicar» con copia fantasma; la barra entra cargada al abrir la copia | pendiente en dispositivo |
| 60 fps al hacer scroll en Android de gama media | pendiente en dispositivo |
| Lector de pantalla: resumen del perfil, cada bloque con sus vueltas y cada ejercicio con su prescripción («Marcha en el sitio, 3 series de 60 segundos») | pendiente en dispositivo |

Suites tras la fase: `test:ui` 21, `test:player` 63, `test:engine` 74, `test:rutinas` 31, `test:borrarTodo` 14 y `test:detalleRutina` 24, todas en verde; `tsc` solo con los 4 errores previos de `tests/`; `lint:color` sin fugas; `expo export` de Android sin errores.

### 17.10 Cambios de presentación que tocan un texto o una acción visible

No cambian ningún dato ni ruta.

- **Bloques.** «calentamiento», «principal · 3 vueltas» y «enfriamiento» pasan a «Calentamiento», «Principal» y «Enfriamiento»; las vueltas salen del título y van a la derecha como el icono de repetir y «×3» (el lector de pantalla oye «3 vueltas»). Un bloque sin vueltas no lleva indicador.
- **Prescripción.** «3 × 60 s» con los números en grande. Plural en la vista: «1 ejercicio», «1 serie», «1 minuto».
- **Tildes.** Los nombres pasan por `nombreVisible` y `textoVisible` («Flexión inclinada», «Puente de glúteo»).
- **Metadatos.** Los chips (objetivo marcado, «N min», «Nivel N», «Silenciosa») son una línea sin repetir: la duración una vez, el objetivo con su icono, el nivel en placas y «Silenciosa» con su icono. En la propia, «N ejercicios» y «N series» son cifras en Big Shoulders, y la etiqueta «MÍA» pasa de la foto a esa línea.
- **Propia.** La lista ya no numera los ejercicios (1, 2, 3…): el orden es el de la lista. El título de sección «Ejercicios» es el bloque plano con su nodo.
- **Cabecera.** El encabezado nativo se oculta y atrás y favorito flotan sobre la foto, como en la ficha de ejercicio. «Esta rutina ya no existe.» trae ahora un botón «Volver» porque ya no hay flecha nativa.
- **Botones.** «Duplicar y editar» y «Duplicar» dejan el botón de contorno por el sólido con icono de copiar; «Empezar esta rutina» y «Empezar» van fijos abajo sobre un degradado.
- **Texto decorativo nuevo.** La etiqueta «PERFIL DE LA RUTINA» sobre la gráfica y las etiquetas de tramo («Calentamiento», «Principal ×3», «Enfriamiento», «Ejercicios»). No muestran datos.

### 17.11 Observaciones (no son errores del rediseño)

- **BUG-12** (`docs/BUGS.md`): las vueltas se muestran pero la sesión no las cumple. Junto con BUG-11 (la copia se guarda antes de editarla), «Duplicar y editar» y «Empezar» tienen tres comportamientos que un dueño de producto debería decidir.
- Solo 7 de los 30 bloques principales traen vueltas; los otros 23 dibujan una sola joroba. Cinco rutinas (rt_017, rt_027 a rt_030) tienen un único bloque principal: su perfil ocupa todo el ancho.
- Seis rutinas del catálogo (rt_004, rt_009, rt_021, rt_022, rt_023 y rt_025) traen el mismo ejercicio más de una vez: sale en cada fila, y la barra de placas (cuando no hay foto) lo distingue con una clave `#n`. Todos los ejercicios de las 30 rutinas existen y traen `seg` o `reps`.


## 18. Parte 9: detalle de programa (auditoría previa)

Archivo: `src/screens/DetallePrograma.tsx` (antes `DetallePrograma` dentro de `Detalles.tsx`). Ruta `Programa { id }` del Stack, con el encabezado nativo (`title: ''`, flecha atrás). Lo que sigue es el comportamiento previo al rediseño y no cambia.

### 18.1 Desde dónde se abre y qué recibe

Hoy («Tu programa», con su botón, y el carrusel de programas), Explorar (tarjeta de programa), Favoritos y Aprender (programas relacionados de un tip) llaman a `navigate('Programa', { id })`. La pantalla recibe solo el id y saca todo de `programaPorId` (`PROGRAMAS`); con un id inexistente queda vacía. No hay estados de carga.

### 18.2 Datos

12 programas, de 6 a 16 semanas. Campos: `name` (trae «· N semanas»), `goal`, `semanas`, `dias_semana` (3 a 5), `min_sesion` (12 a 50), `level`, `equipment`, `modo_sin_saltos?` (solo pg_002; la ficha no lo muestra), `desc`, `honestidad?` y `medicion?` (solo pg_005 y pg_006), `fases: { semanas, foco, rutinas, nota? }[]` y `resultado_esperado`.

- `fases[].semanas` es texto: «1-2», o «7» si es una sola semana. Las fases de cada programa cubren de la semana 1 a la última sin huecos ni solapes (lo comprueba `test:detallePrograma`).
- `fases[].foco` es el nombre de la fase («Aparecer», «Volumen», «Descarga», «Test»…). Cada fase trae de 1 a 5 ids de rutina del catálogo; algunas repiten un id (pg_003, pg_007, pg_008, pg_010, pg_011) y la pantalla los muestra sin repetir (`[...new Set(f.rutinas)]`), en el orden del dato.
- Lo que muestra hoy, en este orden: la foto con el favorito, el título, chips (semanas, días/semana, min y objetivo), la descripción, «Lo que sí y lo que no» (`honestidad`, una `Nota` de cuidado), «Fases» (tarjeta por fase: «Semanas {rango}», el nombre de la fase a la derecha, un carrusel de fotos de rutina y la nota), «Cómo se mide» (`medicion`) y «Qué esperar» (`resultado_esperado`).

### 18.3 Tocar

- Una rutina de una fase: `navigate('Rutina', { id })`, la ficha de la Parte 8.
- Favorito (sobre la foto): `alternarFavorito('programas', id)`.
- Atrás: la flecha nativa.

### 18.4 «Cambiar a este programa»

Barra fija abajo. `activo = perfil.programaId === p.id` y `actual = programaPorId.get(perfil.programaId)`.

- **Si no es el programa actual:** botón «Cambiar a este programa». Sin programa actual (o si ya es este), cambia directo; si sigue otro, una alerta del sistema, «Cambiar de programa»: `Ahora sigues "{actual}". Solo se puede seguir un programa a la vez: para unirte a "{nuevo}" hay que dejarlo primero.`, con «Cancelar» y «Dejarlo y cambiar».
- **Cambiar** es `guardarPerfil({ programaId: p.id, objetivo: p.goal })` (también cambia el objetivo del perfil) y `goBack()`: la pantalla se cierra siempre.
- **Si ya es el actual:** el botón dice «Cambiar de programa» (contorno) y lleva a `Tabs/Explorar { tab: 'programas' }`. No hay estado deshabilitado ni otro texto.

### 18.5 La semana del usuario

La ficha no muestra en qué semana va. El perfil guarda `semanaPrograma` (Hoy lo usa: «Semana N de M»), pero nada lo avanza (BUG-4): siempre vale 1.

### 18.6 Qué usa la app del programa

Ningún archivo de `src/engine` menciona programas ni fases. `programaId` solo lo leen Hoy y Yo (para mostrar el programa), el guardado de la sesión y el cuestionario (`elegirPrograma`). Elegir un programa cambia el objetivo del perfil y lo que se ve en Hoy; las rutinas de sus fases y su calendario no arman la sesión de cada día (se suma a BUG-4).

### 18.7 Registro de la Parte 9

«código» = lectura de código, `tsc`, `lint:color` y las suites; nada se ha corrido en dispositivo.

| Punto | Estado |
|---|---|
| Mismos datos, mismas fases y mismas rutinas (sin repetir) en el mismo orden | ✅ código |
| Tocar una rutina abre `Rutina { id }`; favorito y atrás como antes | ✅ código |
| «Cambiar a este programa»: mismo cambio (`guardarPerfil` y `goBack`), misma confirmación con el mismo texto y las mismas dos salidas, y el mismo botón cuando ya es el actual | ✅ código |
| Los rangos de las fases se leen bien y cubren cada programa sin huecos; cada semana de los 12 programas tiene minutos reales | ✅ prueba (`test:detallePrograma`, 43) |
| «Semana 7» y «Semana 8» en singular; «Semanas 1–2» con guion corto | ✅ prueba |
| Las tildes de los programas y sus fases (`Sesión mínima`, `propósito`, `Día de descarga`, `sensación`, `Hábito`, `pérdida`, `déficit energético`, `alimentación`, `Adaptación`…) | ✅ prueba |
| Las etiquetas de las fases caben y no se montan en los 12 programas | ✅ prueba |
| Hero, barra superior, placas de dato que caen, mapa de carga que se carga y se apaga con el scroll, riel, sello de la etiqueta, tarjetas que entran, hoja de confirmación | pendiente en dispositivo |
| Tocar una fase en el mapa lleva a su sección y la resalta | pendiente en dispositivo |
| 60 fps al hacer scroll en Android de gama media | pendiente en dispositivo |
| Lector de pantalla: resumen del plan y cada fase con su rango y nombre | pendiente en dispositivo |

Suites tras la fase: `test:ui` 21, `test:player` 63, `test:engine` 74, `test:rutinas` 31, `test:borrarTodo` 14, `test:detalleRutina` 24 y `test:detallePrograma` 43, todas en verde; `tsc` solo con los 4 errores previos de `tests/`; `lint:color` sin fugas; `expo export` de Android sin errores.

### 18.8 Cambios de presentación que tocan un texto o una acción visible

No cambian ningún dato ni ruta.

- **Semanas, días y minutos** dejan de ser chips grises y pasan a tres placas con el número grande. En 360 px la unidad de los días va abreviada («días/sem»; el lector de pantalla oye «días por semana»). El objetivo va al lado, como texto con su icono. El título conserva su «· N semanas».
- **«Fases» pasa a «El plan»** (el brief permitía el título nuevo): el mapa de carga y, debajo, la línea de tiempo de las fases.
- **Rango de semanas:** «Semanas 1–2» con guion corto y «Semana 7» y «Semana 8» en singular (`plural`, solo en la vista). El nombre de la fase pasa de texto gris a etiqueta.
- **Confirmación:** la alerta del sistema pasa a una hoja inferior con el mismo texto y las mismas dos salidas («Cancelar», «Dejarlo y cambiar»); los nombres salen con sus tildes.
- **Botón cuando ya es el actual:** «Cambiar de programa» pasa del contorno al botón secundario sólido, con la misma acción.
- **Tildes** (solo en la vista; los datos no cambian): se amplió el mapa de `nombresVisibles` con «acumulación», «adaptación», «básicos», «consolidación», «había», «integración», «intensificación», «máximas», «medición», «puntuación», «reactivación», «superávit» y «típica», y unas frases con «pérdida de» y «lo que sí».
- **«Qué esperar»:** el texto se conserva íntegro, pasa de gris a `magnesia` en una tarjeta con filo verde. El brief pedía también «una línea con icono de información» al pie y a la vez que el párrafo no se separa: no se añadió la línea.

### 18.9 Observaciones (no son errores del rediseño)

- Con la semana en que va el usuario fija en 1 (BUG-4), un programa en curso marca siempre su primera fase en azul y con el anillo que late. Es lo que el perfil guarda; cuando se corrija BUG-4 se moverá solo.
- Las alturas del mapa salen de `dias_semana` por el promedio de los `min` de las rutinas de la fase de cada semana. Las fases no dicen cuántas sesiones tiene cada semana, y en algunos programas (por ejemplo, pg_005 con 5 días y 2 rutinas por fase) las rutinas de una fase no son tantas como los días: es una estimación visual, no un calendario.
- pg_004 (16 semanas con tres «Descarga» de una semana y un «Test de fuerza» de una) necesita 4 filas para las etiquetas del mapa; el resto, 1 a 3.


## 19. Parte 10: músculos (catálogo y ficha, auditoría previa)

Dos piezas: el segmento **Músculos** de Explorar (`src/screens/Explorar.tsx`, la rejilla `RejillaMusculos`) y la ficha `Musculo { id }` (`DetalleMusculo`, que vivía en `src/screens/Detalles.tsx`; ruta del Stack con el encabezado nativo, `title: ''`). Lo que sigue es el comportamiento previo al rediseño y no cambia.

### 19.1 Catálogo

- **Origen y orden.** `MUSCULOS` sale de `assets/data/01_muscles.json`: 52 músculos en el orden del archivo. La lista se filtra pero nunca se ordena.
- **Búsqueda.** El mismo campo de Explorar filtra por `name` o `group` (`toLowerCase().includes`), sin quitar tildes (se suma a BUG-8). No hay filtro por objetivo ni por categoría en este segmento (las filas de chips no salen) y «Lo que puedo hacer» no aplica.
- **Contador.** `${n} músculos` con la longitud de la lista filtrada.
- **Tocar un músculo:** `navigate('Musculo', { id })`. Las fichas de la rejilla no llevan favorito.
- **Agrupación.** Cada músculo trae `group` (12 valores: pecho, hombro, brazo, espalda, core, cadera, gluteo, pierna, pantorrilla, pie, cuello, facial) y `region` (4: tren_superior, core, tren_inferior, cabeza_cuello). El orden del archivo agrupa por `group` casi siempre, pero no del todo: en orden salen pecho 2, hombro 4, brazo 4, espalda 9, core 6, cadera 1, gluteo 3, pierna 4, **cadera 1** (otra vez), pantorrilla 3, pie 1, cuello 3, facial 10 y **core 1** (otra vez): 14 tramos.
- **Imágenes.** Una por músculo (`<id>.jpg`, JPG de 800×437 con fondo claro y el músculo ya resaltado en rojo). No existe ninguna versión neutra (`<id>_neutra.jpg`, ver `docs/IMAGENES.md`) ni recorte transparente.

### 19.2 Ficha de músculo

- **Datos.** `name`, `name_en` (el nombre en latín: «Pectoralis major»), `group` y `region` (las dos etiquetas crudas: «pecho», «tren_superior»), `funcion`, `dolor_comun` (los 52 lo traen), `trabaja_con` (sinérgicos: 1 a 3) y `antagonista` (0 a 2; 12 músculos no traen ninguno). Los ejercicios salen de `EJERCICIOS`: principal si `primary` incluye el id y secundario si `secondary` lo incluye (nunca los dos a la vez; hasta 44 y 65 ejercicios). 7 músculos no tienen ejercicios como principal y 3 como secundario.
- **Lo que se ve hoy, en este orden:** la imagen en un círculo de 128 y centrada, el nombre (`h1`, centrado), `name_en`, dos chips con el dato crudo (`group`, `region`), la estrella de favorito de 40 debajo de los chips, `funcion`, «Lo que suele pasar» (`dolor_comun` en una `Nota` de cuidado), «Trabaja junto a» y «Antagonistas» (un `Carrusel` de círculos, cada uno con el botón «Todos»), «Lo trabajan como principal (N)» (filas de 54 con nombre y equipo) y «Como secundario (N)» (tarjetas de 116×84 en un carrusel).
- **Acciones.** Favorito: `alternarFavorito('musculos', id)`. Tocar un músculo relacionado: `push('Musculo', { id })` (abre otra ficha de músculo, apilada). «Todos» (en las dos secciones): `navigate('Tabs', { screen: 'Explorar', merge: true, params: { tab: 'musculos' } })`. Tocar un ejercicio, principal o secundario: `push('Ejercicio', { id })`. Atrás: la flecha nativa.
- **Secciones vacías.** «Trabaja junto a» y «Antagonistas» no salen si la lista está vacía (12 músculos no tienen antagonistas); «Como secundario», si no hay ejercicios (3 músculos). «Lo trabajan como principal» **sí sale siempre**, con «(0)» y sin filas, en los 7 músculos sin ejercicios principales.
- **Referencias rotas.** 6 músculos citan a otros que no existen en el catálogo (BUG-13): hoy salen como una ficha con el id crudo y, al tocarla, se abre una pantalla en blanco.
- **Quién abre la ficha.** Explorar, «Músculos de hoy» de Hoy, la ficha de ejercicio («Músculos que trabaja»), Favoritos y las propias fichas de músculo relacionadas.

### 19.3 Tildes y etiquetas en la vista

`nombreVisible` ya corrige la mayoría de los nombres (Tríceps, Bíceps, escápula, extensión, torácica…). Faltaban `crónicamente`, `débil`, `débiles`, `distensión`, `inserción`, `síndrome`, `típico` y `teórico` en las funciones y en «lo que suele pasar». Las etiquetas `group` y `region` se muestran hoy crudas («tren_superior»); el rediseño las limpia solo en la vista.

### 19.4 Registro de la Parte 10

«código» = lectura de código, `tsc`, `lint:color` y las suites; nada se ha corrido en dispositivo.

| Punto | Estado |
|---|---|
| Los 52 músculos salen en el mismo orden y abren la misma ficha (`navigate('Musculo', { id })`); la búsqueda y el contador son el mismo código, sin tocar | ✅ código |
| La ficha lee los mismos datos; favorito (`alternarFavorito('musculos', id)`), «Todos» (`Tabs/Explorar { tab: 'musculos' }`, en las dos secciones), músculo relacionado (`push('Musculo')`) y ejercicio (`push('Ejercicio')`) hacen lo mismo | ✅ código |
| La agrupación no reordena: los 14 tramos de grupo suman los 52 músculos en su orden; las filas de la rejilla cubren las 52 fichas; cada fila empieza donde acaba la anterior | ✅ prueba (`test:musculos`, 43) |
| Las etiquetas del dato salen sin guion bajo y con mayúscula («Tren superior», «Cabeza y cuello»); las tildes de los 52 músculos | ✅ prueba |
| Las referencias a músculos que no existen se conservan con nombre legible y sin acción (BUG-13); 7 músculos sin ejercicios principales y 12 sin antagonistas no dejan hueco | ✅ prueba y código |
| Rejilla de fichas cuadradas, encabezados de región pegados, ola diagonal, hero, sinérgicos que llegan juntos, antagonistas que rebotan, conectores, marcas de los ejercicios | pendiente en dispositivo |
| 60 fps al hacer scroll por los 52 músculos en Android de gama media | pendiente en dispositivo |
| Lector de pantalla: «Trabaja junto a: Serrato anterior», «Antagonistas: Trapecio medio, Romboides» y cada ficha como botón | pendiente en dispositivo |

Suites tras la fase: `test:ui` 21, `test:player` 63, `test:engine` 74, `test:rutinas` 31, `test:borrarTodo` 14, `test:detalleRutina` 24, `test:detallePrograma` 43 y `test:musculos` 43, todas en verde; `tsc` solo con los 4 errores previos de `tests/`; `lint:color` sin fugas; `expo export` de Android sin errores.

### 19.5 Cambios de presentación que tocan un texto o una acción visible

No cambian ningún dato ni ruta.

- **Catálogo.** Los 52 círculos pasan a fichas cuadradas de radio 24, en tres columnas, con un encabezado cada vez que cambia el grupo (14 en total, con cuántos músculos trae ese tramo). Como el orden del dato no es continuo, «Cadera» y «Core» salen dos veces. Los nombres se ven completos, centrados, hasta dos líneas; los más largos («Flexores de cadera (psoas ilíaco)», «Musculatura intrínseca del pie») necesitan tres o cuatro y esa fila crece.
- **Fondo de las fichas.** Los renders traen fondo claro, así que van sobre una ficha `magnesia` (#F2F1EC) con la foto a su opacidad completa; ya no se atenúan sobre `gomaAlta` como en la ficha de ejercicio de la Parte 5.
- **Etiquetas.** Los dos chips con el dato crudo («pecho», «tren_superior») pasan a una línea «Pecho · Tren superior». `cabeza_cuello` se lee «Cabeza y cuello». Si el grupo y la región dicen lo mismo (`core`), sale una sola.
- **Favorito.** La estrella sube al hero (arriba a la derecha, como en la ficha de ejercicio) y el círculo de 128 desaparece.
- **«Lo que suele pasar».** De «LO QUE SUELE PASAR» en una nota amarilla a una tarjeta con filo amarillo y el título en tipo oración con icono de advertencia.
- **«Todos».** Los dos círculos azules gigantes pasan a un botón de texto con chevron a la derecha del título. Misma acción.
- **Sinérgicos y antagonistas** dejan de verse iguales: título con `››` o `›‹`, una mini ficha del músculo actual al inicio del carrusel y un conector continuo o discontinuo con tope.
- **Ejercicios.** Un solo título «Ejercicios» y dos subgrupos, «Como principal» y «Como secundario» (antes «Lo trabajan como principal (N)» y «Como secundario (N)»), con el conteo aparte y sin paréntesis. Los dos usan `FilaEjercicio` de Explorar: los secundarios dejan de ser tarjetas y **todas las filas ganan la estrella de favorito** (`alternarFavorito('ejercicios', id)`, que ya existía). Un subgrupo vacío no aparece; antes «como principal» salía siempre, con «(0)», en los 7 músculos sin ejercicios principales.
- **Tildes de los 52 músculos.** Ya corregían: aducción, aérea, ahí, ángulo, atrás, bíceps, cigomáticos, común, cuádriceps, definición, desviación, digástrico, dirección, dorsiflexión, escápula, estrés, extensión, flexión, glúteo, húmero, ilíaco, intrínseca, lesión, línea(s), mandíbula, más, masticación, mentón, multífidos, muñeca, músculo(s), número, órganos, pélvica(o)(s), posición, protrusión, rápido, respiración, síntomas, sóleo, suspensión, también, teléfono, tensión, torácica, tórax, tracción, tríceps, única y vía. **Se añadieron** crónicamente, débil, débiles, distensión, inserción, síndrome, teórico y típico. No se tocan las ambiguas (esta, como, cuando, solo…).

### 19.6 Observaciones (no son errores del rediseño)

- **BUG-13** (`docs/BUGS.md`): seis músculos citan a otros cinco que no existen en el catálogo.
- La búsqueda de Explorar no quita tildes (BUG-8): buscar «tríceps» no encuentra el «Triceps braquial» del dato.
- No existe ninguna versión neutra de los renders (`<id>_neutra.jpg`): el «músculo que se enciende» está construido y dormido; hoy el hero entra con escala 0.96 a 1. Se activa solo cuando se copian esas imágenes (ver `docs/IMAGENES.md`).
- Un músculo llega a tener 44 ejercicios como principal y 65 como secundario. La ficha es un `ScrollView` (no virtualiza), como antes con el carrusel de los secundarios: si el desplazamiento no va fluido en un Android de gama media, el siguiente paso es virtualizar esa lista.


## 20. Parte 11: Aprender y artículo (auditoría previa)

Tres piezas: la pestaña **Aprender** (`src/screens/Aprender.tsx`) y las rutas `Tip { id }` (`DetalleTip`) y `Mito { id }` (`DetalleMito`), que vivían en el mismo archivo y eran rutas del Stack con el encabezado nativo (`title: ''`). Lo que sigue es el comportamiento previo al rediseño y no cambia.

### 20.1 Segmentos, búsqueda y categorías

- **Segmentos.** Tips, Mitos, Alimentación y Glosario, en una fila de chips con `tab` en el estado de la pantalla. Se cambia solo con un toque (no hay deslizamiento entre segmentos). Cada uno monta su lista.
  - **Tips:** `TIPS` (38) en el orden del dato, filtrados por categoría y por la búsqueda (`titulo` o `cuerpo`).
  - **Mitos:** `MITOS` (20: 17 «mito» y 3 «parcial»), filtrados por la búsqueda solo sobre `titulo`; al pie, `ERRORES` (15 «errores de ejecución más frecuentes», sin filtrar).
  - **Alimentación:** `NUTRICION` completa y sin filtrar (la búsqueda no la toca): `principio_de_diseno`, `lo_que_la_app_no_hace` (6), `conceptos` (15, todos con `implicacion`) y `aviso`.
  - **Glosario:** `GLOSARIO` (32 términos) filtrado por `termino` o `def`; al pie, `FAQ` (18 preguntas, sin filtrar).
- **Categorías.** Solo en Tips: «Todas» y las 9 salas (`SALAS`), de **selección única**; tocar la activa la quita (vuelve a «Todas»). No hay fila de categorías en los otros segmentos y no cambia por segmento. Tips por sala: empezar 4, técnica 6, constancia 4, dolor 5, mandíbula 5, postura 4, running 4, alimentación 3, descanso 3.
- **Búsqueda.** Un solo campo, compartido entre segmentos (se conserva al cambiar), con `toLowerCase().includes` y sin quitar tildes: se suma a BUG-8.
- **«Sin conexión ✓».** Si `estado.descargas` incluye `'aprender'`, un chip junto al título. Si no, el muro `MuroCategoria` («todo el contenido», con `TIPS.length + MITOS.length`) cubre la pantalla: «Ver anuncio» abre `Intersticial` y, al cerrarlo, `registrarDescarga('aprender')`; «Volver» va a `navigate('Hoy')`.

### 20.2 Tarjeta de artículo (segmento Tips)

Campos: foto (`tip`, por id), sala (`salaPorId`), `titulo`, `cuerpo` (dos líneas cortadas con «…») y la estrella de favorito. Tocar la tarjeta: `navigate('Tip', { id })`. La estrella: `alternarFavorito('tips', id)`; el estado sale de `esFavorito('tips', id)`.

### 20.3 Artículo (`Tip { id }`)

- **Datos.** `titulo`, `sala`, `cuerpo` (un solo bloque de texto: ningún tip trae saltos de línea; de 36 a 89 palabras), `tags` (34 distintas, en minúsculas: «principiante», «habito») y `relacionado`.
- **Al abrir.** `marcarTipLeido(id)` (una vez por tip, en el montaje).
- **Relacionado.** Cada id se resuelve por su prefijo: `ex_` es un ejercicio → `navigate('Ejercicio', { id })`; `rt_` → `navigate('Rutina', { id })` («Ver rutina»); `pg_` → `navigate('Programa', { id })` («Ver programa»). Los ids de otro artículo (`tip_`) no llevan a ninguna parte y no se dibujan; `tip_021` se cita a sí mismo. Todos los `rt_` y `pg_` de los tips existen en el catálogo.
- **Etiquetas.** Un `Chip` por etiqueta, **sin acción**: no son tocables.
- **Favorito.** La estrella sobre la foto, con `alternarFavorito('tips', id)`.

### 20.4 Mitos

- **Datos.** `id`, `titulo` (la afirmación: «Hacer abdominales quema la grasa del abdomen»), `veredicto` (17 «mito», 3 «parcial»; ninguno «ok»), `categoria`, `afirmacion_popular` (lo que se dice), `explicacion` (el porqué), `que_hacer` y `relacionado`.
- **Lista.** Miniatura de 70, `titulo` y `explicacion` (dos líneas). El veredicto solo se etiquetaba cuando **no** era «mito»; tocar la fila: `navigate('Mito', { id })`. La nota de introducción se ve siempre («Saber qué no funciona vale tanto como saber qué sí…»).
- **Detalle.** Foto, la insignia (solo si no es «mito»), el título, «Lo que se dice» (`Nota`), «Por qué», «Qué hacer en su lugar» (`Nota` de tono bueno) y «Relacionado». No trae favorito.
- **Relacionado.** Solo se mostraban los ejercicios (`porId`); los ids de familia (`fam_`, 8), de estructura (`str_`, 2), de otro artículo (`tip_`, 2), una rutina (`rt_`) y un programa (`pg_`) se descartaban en silencio.
- **Errores de ejecución.** Título, «por qué importa», «Corrección» (nota de tono bueno) y una fila de ejercicios (miniatura de 100×68 y nombre) que abren `navigate('Ejercicio', { id })`.

### 20.5 Alimentación y Glosario

- **Alimentación.** «Cómo funciona aquí» (`principio_de_diseno`, una `Nota`), «Lo que esta app no hace» (6 puntos en una tarjeta con viñeta «·»), «Información general» (15 conceptos: foto de 52, título, cuerpo completo y, en una `Nota` de tono bueno, la `implicacion`) y el `aviso`. Los conceptos no son tocables. Las fotos salen de la carpeta de los tips por el id del concepto (`nut_001`…); `nut_008` no tiene foto y se ve el glifo de respaldo.
- **Glosario.** Los 32 términos, en el orden del dato: **dos bloques alfabéticos** (A–…, y otra vez A–… a partir de «ATM»), no uno solo. Cada uno lleva `termino` y `def` completa. Sin acciones. Al pie, las preguntas frecuentes: un acordeón de una fila por pregunta (`+` / `−`), cada una se abre y se cierra sola (varias pueden estar abiertas) y ninguna trae el signo «¿». Dos respuestas nombran la insignia «Parcial» y una las tres («Comprobado», «Parcial», «Mito»).

### 20.6 Registro de la Parte 11

«código» = lectura de código, `tsc`, `lint:color` y las suites; nada se ha corrido en dispositivo.

| Punto | Estado |
|---|---|
| Segmentos, categorías y búsqueda muestran los mismos tips, mitos, términos y preguntas que antes (mismos filtros, sin tocar) | ✅ código |
| Cada tarjeta abre el mismo artículo; el favorito (`'tips'`), `marcarTipLeido` y el muro con `registrarDescarga('aprender')` hacen lo mismo | ✅ código |
| Los relacionados llevan al mismo ejercicio, rutina o programa (`Ejercicio`, `Rutina`, `Programa`); los `rt_` y `pg_` de los 38 tips existen y salen con su nombre real | ✅ prueba (`test:aprender`, 62) |
| Los 32 términos se agrupan por letra sin reordenar (una «A» vuelve a salir en el segundo bloque); las 18 preguntas abren con «¿» | ✅ prueba |
| Tiempo de lectura (palabras ÷ 200, hacia arriba, mínimo 1); etiquetas y categorías sin dato crudo; comillas latinas; las tildes de los 4 textos | ✅ prueba |
| «FORJA» aparece una sola vez en los textos de Aprender (`principio_de_diseno`) y **no se cambió** | ✅ prueba |
| Lista de mitos con tachado línea por línea y sello al entrar 60 % en pantalla; detalle de mito (sello, tachado, cita, «Qué hacer en su lugar» con filo y palomita); artículo con progreso y marca de fin | pendiente en dispositivo |
| Glosario: letras pegajosas, acordeón con «+» que gira a «×», altura animada y desplazamiento para mostrar la respuesta | pendiente en dispositivo |
| Insignias en línea dentro de las respuestas del glosario (`INSIGNIAS_EN_LINEA` en `PreguntaAcordeon.tsx`; si rompen el salto de línea, se apaga) | pendiente en dispositivo |
| 60 fps al hacer scroll por Tips, Mitos y Glosario en Android de gama media | pendiente en dispositivo |
| Lector de pantalla: cada mito («Los abdominales queman la panza. Mito.»), acordeón con `expanded`, texto del artículo escalable hasta 1.3 | pendiente en dispositivo |

Suites tras la fase: `test:aprender` 62, `test:musculos` 43, `test:detallePrograma` 43, `test:detalleRutina` 24, `test:ui` 21, `test:player` 63, `test:engine` 74, `test:rutinas` 31 y `test:borrarTodo` 14, todas en verde; `tsc` solo con los 4 errores previos de `tests/`; `lint:color` sin fugas; `expo export` de Android sin errores.

### 20.7 Cambios de presentación que tocan un texto o una acción visible

No cambian ningún dato ni ruta.

- **Categorías.** De «EMPEZAR» en mayúsculas espaciadas a «Empezar» en tipo oración, con un icono de línea por categoría. Las 9 salas se ven con tilde («Técnica», «Alimentación»).
- **Extractos.** Dejan de cortarse con «…»: la segunda línea se desvanece hacia la derecha en sus últimos 40 px.
- **Artículo.** El cuerpo pasa de un bloque a una columna de lectura de Figtree 18/30 (unos 62 caracteres por línea); se agrega el tiempo de lectura («1 min de lectura», calculado en la vista con palabras ÷ 200), una línea de progreso en la barra superior y una huella de magnesia al final (solo decorativa: no guarda nada). Las etiquetas pasan de chips a texto separado por un punto («Principiante · Hábito»), siguen sin ser tocables.
- **Relacionado.** De «Ver programa» y «Ver rutina» a una tarjeta de 200 con el tipo y el **nombre real** («Empezar de cero · 8 semanas»). Los ejercicios también salen como tarjeta con su nombre. Misma navegación.
- **Mitos, lista.** Miniatura de 72 (desaturada un 20 % más), afirmación en Big Shoulders con su veredicto **siempre** debajo (antes solo si no era «mito»), explicación con desvanecido. La introducción pasa de tarjeta blanca a nota con barra `placaRoja`. «Parcial» no se tacha y «Comprobado» llevaría palomita verde (hoy ninguno es «ok»).
- **Mitos, detalle.** El sello «Mito» **ahora también se ve** (antes se omitía) y se estampa sobre la afirmación tachada. «LO QUE SE DICE» en una tarjeta pasa a «Lo que se dice» como cita, sin tarjeta, con comillas de 48 px; «Qué hacer en su lugar» de nota verde menta a tarjeta con filo y palomita verdes. **Sin favorito**: el mito nunca tuvo, y la barra superior no dibuja la estrella.
- **Mitos, relacionado.** Además de los ejercicios (ahora con `FilaEjercicio` de Explorar, con su estrella) se ven la rutina y el programa que dos mitos citan y que antes se descartaban; los ids de familia, de estructura y de otro artículo siguen sin dibujarse.
- **Errores de ejecución.** La tarjeta se abre: título, por qué importa, la corrección en una tarjeta verde con filo y los ejercicios como tarjetas con su nombre (antes miniaturas de 100 px). Mismo contenido.
- **Alimentación.** «Cómo funciona aquí» pasa de nota a un bloque con filo de `magnesia` y texto principal; «Lo que esta app no hace» de una tarjeta con viñetas a filas con un icono «prohibido» dibujado en `magnesia` (no rojo); cada concepto con miniatura de 48 y su consejo práctico en una tarjeta con filo verde y flecha (antes una nota verde). Comillas rectas simples pasan a latinas («calorías restantes»).
- **Glosario.** Encabezados de letra pegajosos (Big Shoulders 800), términos en Big Shoulders 700 y el acordeón con «+» que gira a «×» y una respuesta que se despliega; la pregunta abierta pasa a Big Shoulders. Las 18 preguntas se leen con «¿…?». Las palabras «Comprobado», «Parcial» y «Mito» de una respuesta salen como insignias en línea.
- **Tildes corregidas en la vista** (el dato no se toca; `nombresVisibles.ts` y `presentacion.ts`): en tips y artículos, «más común», «día», «sesión», «consolación», «estímulo», «hábitos», «repetición», «único», «cuántos días», «partías», «esté tensa»; en mitos, «reducción», «músculo», «según», «energético», «termorregulación», «sudoración», «sí hace», «clásico»; en alimentación, «calorías», «decisión», «nutrición», «analíticas», «medicación», «colección», «calórico», «condición», «térmico», «añadir», «Proteína», «lácteos», «de qué se compone», «en cuánto músculo», «es cuánto tiempo», «en cómo te sientes»; en el glosario, «Antiextensión», «Antirrotación», «Función», «Patrón», «atrás», «Concéntrica», «cuántas»; en las preguntas, «después», «Qué hago», «mandíbula», «Por qué», «rompió», «perdí», «Qué significan». No se tocan las ambiguas (esta, si, aun, solo…).

### 20.8 Observaciones (no son errores del rediseño)

- **«FORJA» en un texto visible.** «Cómo funciona aquí» dice DARENOW no prescribe dietas…», pero la app se llama DARENOW. **No se cambió**: queda pendiente de decisión del dueño. Es la única aparición en los textos de Aprender (`assets/data/32_nutrition.json`, `principio_de_diseno`). En el código, «FORJA» solo está en comentarios y en el prefijo de almacenamiento `forja:`.
- **La búsqueda de Aprender no quita tildes** (BUG-8): buscar «técnica» no encuentra los textos sin tilde del dato, y la de Mitos solo mira el título (no la afirmación).
- **Datos.** `tip_021` se cita a sí mismo como relacionado (no se dibuja). Dos textos del catálogo traen «te siente» donde debería decir «te sientes» (una `implicacion` de alimentación y un `que_hacer` de un mito); el rediseño no los corrige.
- **Fotos.** Las 38 fotos de tips y las 20 de mitos existen; los hero de mitos se desaturan un 20 % más solo en la vista (`MATRIZ_DESATURADA`) y las miniaturas de la lista lo hacen con un gris en modo `saturation`, sin tocar los archivos.
- **No construido.** La transición de elemento compartido foto → hero (Reanimated 4.5 la tiene tras un indicador estático). Mitos, Alimentación y Glosario se aplicaron por el tipo de dato, no por captura.


## 21. Parte 12: pestaña Yo (auditoría previa)

La pestaña `Yo` (`src/screens/Yo.tsx`, componente por defecto). El mismo archivo aloja las pantallas `Logros`, `Retos`, `Mediciones`, `Historial` y `Ajustes` (Partes 13 y 14), que no cambian aquí. Lo que sigue es el comportamiento previo al rediseño y no cambia.

### 21.1 Encabezado

- **Nombre.** `perfil.nombre`, o «Tu progreso» si está vacío.
- **Una sola línea** «objetivo · programa»: `nombreGoal(perfil.objetivo)` (de `GOALS`: «Ganar musculo») y `programaPorId(perfil.programaId)?.name` o «sin programa». No es tocable.
- **Semana del programa.** La app guarda `estado.semanaPrograma` (siempre 1: nada la avanza, ver BUG-4) y Hoy y el detalle de programa la muestran («Semana N de M»). Yo no mostraba nada de esto; el rediseño usa el mismo dato.

### 21.2 Estadísticas y últimos 7 días

- **Cuatro números** en una tarjeta: `racha.dias` (`calcularRacha`: solo cuenta una sesión con al menos una serie real), `estadisticas(sesiones).total` (**todas** las sesiones guardadas, también las abandonadas), `minutos` (la suma de `duracionS` de todas ÷ 60, redondeada) y `series` (las series no omitidas de todas). Etiquetas fijas: «racha», «sesiones», «minutos», «series».
- **Últimos 7 días** (`ultimos7`): siete fechas hacia atrás desde ahora **en UTC** (BUG-17) con los minutos de cada una. Si no hay ninguna sesión guardada (`stats.total === 0`) se ve el texto «Cuando entrenes, aquí vas a ver tu semana.»; con alguna, las siete barras de minutos (aunque toda la semana sea 0: el «hueco de 150 px»). Las barras no son tocables.

### 21.3 Calendario

- **Navegación.** Solo las dos flechas (no hay deslizamiento): hacia atrás sin límite; la de adelante se apaga desde el mes de hoy. El cambio de mes es un desvanecido.
- **Marcas.** `diasEntrenados` (las fechas distintas de **cualquier** sesión guardada) y `minutosPorDia`: menos de 25 minutos, un tinte azul pálido con borde; 25 o más, relleno azul. Hoy sin sesión lleva un anillo; hoy **con** sesión no lo lleva (solo el relleno).
- **Tocar un día:** nada. **«días este mes»:** las fechas del mes que están en el conjunto; **«días en total»:** el tamaño del conjunto. Los dos, con la etiqueta fija en plural.

### 21.4 Favoritos, logros, retos, mediciones, historial y ajustes

- **Favoritos.** Los cinco tipos (`ejercicios`, `musculos`, `rutinas`, `programas`, `tips`). Vacío: «Toca la estrella en cualquier ejercicio, rutina o tip para guardarlo aquí.» Con alguno: cinco chips con los conteos («2 ejercicios», «0 músculos»…), que no son tocables. «Ver todos» → `navigate('Favoritos')`.
- **Logros.** `LOGROS` son 20 y Yo muestra los **8 primeros** como chips (los ganados, resaltados; no son tocables) sobre una barra de progreso con «N de 20 logros» (N cuenta todos los ganados, se vean o no) y la nota «Ninguno depende de tu peso ni de una medida.». «Todos» → `navigate('Logros')`.
- **Retos.** `RETOS` son 15 y Yo muestra los 3 primeros como tarjeta con el nombre y el objetivo; tocar una lleva a `Retos`. **Datos de progreso:** `estado.retos[id] = { iniciado, progreso, completado? }`, que solo existe para los retos que se empezaron con «Empezar reto» y nada actualiza (BUG-16). «Ver» → `navigate('Retos')`.
- **Mediciones.** Solo el texto «Protocolos repetibles para que las comparaciones signifiquen algo. Todas son opcionales.» Yo no muestra las mediciones registradas (eso lo hace la pantalla `Mediciones`, con «N registros · último: …»). «Registrar» → `navigate('Mediciones')`.
- **Historial.** Las 3 últimas sesiones (`sesiones.slice(-3).reverse()`) en tarjetas con la **fecha cruda** («2026-09-25») y «N min · M series»; sin ninguna, «Aún no hay sesiones.» Las filas no son tocables. «Ver todo» → `navigate('Historial')`.
- **Ajustes.** Un botón de contorno «Ajustes» → `navigate('Ajustes')`.

### 21.5 Registro de la Parte 12

«código» = lectura de código, `tsc`, `lint:color` y las suites; nada se ha corrido en dispositivo.

| Punto | Estado |
|---|---|
| Nombre, objetivo, programa y todos los números (racha, sesiones, minutos, series, últimos 7 días, días este mes y en total) salen de las mismas funciones de `store.ts`, sin tocar | ✅ código |
| «Ver todos», «Todos», «Ver», «Registrar», «Ver todo» y «Ajustes» llevan a `Favoritos`, `Logros`, `Retos`, `Mediciones`, `Historial` y `Ajustes`; tocar un reto lleva a `Retos` | ✅ código |
| Los mismos 8 logros, 3 retos, 3 sesiones y favoritos de los cinco tipos; el calendario navega con las mismas flechas y no pasa del mes de hoy | ✅ código |
| Placas de los últimos 7 días a escala de la semana (el día más largo llena la columna; una semana en 0 no lleva placas y se compacta); celdas del calendario, etiquetas de cada día y «días este mes» | ✅ prueba (`test:perfil`, 41) |
| Fecha legible («Viernes 25 de septiembre», con el año solo si no es el actual), plurales («1 sesión», «1 día», «1 serie») y tildes de los logros, retos y objetivos | ✅ prueba |
| Favoritos mezclados de los cinco tipos, indicador de cada reto (7 placas, 30 celdas, barra de 100) y filas del historial | ✅ prueba |
| Placas que caen, calendario con huellas y anillo dibujado, medallas que giran, retos que se llenan, engrane que gira, estrella que se dibuja | pendiente en dispositivo |
| 60 fps al hacer scroll por toda la pestaña en Android de gama media | pendiente en dispositivo |
| Lector de pantalla: cada día del calendario («Viernes 25, hoy, sesión corta»), cada medalla («Primera semana, ganado» / «Un mes en pie, pendiente») | pendiente en dispositivo |

Suites tras la fase: `test:perfil` 41, `test:aprender` 63, `test:musculos` 43, `test:detallePrograma` 43, `test:detalleRutina` 24, `test:ui` 21, `test:player` 63, `test:engine` 74, `test:rutinas` 31 y `test:borrarTodo` 14, todas en verde; `tsc` solo con los 4 errores previos de `tests/`; `lint:color` sin fugas; `expo export` de Android sin errores.

### 21.6 Cambios de presentación que tocan un texto o una acción visible

No cambian ningún dato ni ruta.

- **Acciones de sección.** Las cinco píldoras azules («Ver todos», «Todos», «Ver», «Registrar», «Ver todo») pasan al mismo enlace de texto con chevron (`AccionSeccion`, el de Hoy). «Ajustes» pasa de botón de contorno a una fila con engrane, bordes finos y el wordmark DARENOW debajo.
- **Encabezado.** La línea «objetivo · programa» se separa en dos: el objetivo con su icono y el programa en su propia línea, con las tildes («Ganar músculo», «Músculo en casa con mancuernas»). Si hay programa se agrega «Semana N de M» con una placa por semana (con `semanaPrograma`, que hoy siempre es 1: BUG-4).
- **Estadísticas.** De una tarjeta con cuatro números iguales a cuatro placas de dato con los números que ruedan. La etiqueta de sesiones, minutos y series respeta el plural. Con racha mayor que 0 la placa lleva una huella; en 0 no cambia nada (sin tono de castigo).
- **Últimos 7 días.** De siete barras a siete pilas de placas dibujadas con Skia; una semana en cero baja de 120 a 64 px. Sin ninguna sesión guardada sigue el texto de siempre.
- **Calendario.** Sin tarjeta; los días con sesión llevan una huella en contorno (corta) o rellena (25 min o más) en vez de un fondo azul; **hoy siempre lleva su anillo**, también con sesión. La leyenda pasa a las dos huellas con el mismo texto; «días este mes» y «días en total» pasan a dos placas y respetan el plural («1 día»).
- **Favoritos.** De chips con conteos a una fila que se desliza con los favoritos mezclados (hasta 8, del más reciente al más antiguo, por turnos entre tipos), cada uno con foto, etiqueta de tipo, nombre y estrella. **Ahora se pueden abrir y quitar desde Yo** (`navigate` a la misma ruta que Favoritos y `alternarFavorito`, que ya existían).
- **Logros.** De chips de texto a una vitrina de medallas: las ganadas, completas; las pendientes, solo el aro con el icono al 30 %, sin candados. El «N» de «N de 20 logros» deja de ser azul y la barra pasa a 20 placas. La nota va con barra verde.
- **Retos.** De tarjetas blancas de texto a tarjetas de radio 20 con un indicador de progreso (7 placas, 30 celdas o barra de 100) **solo** en los retos ya empezados; los demás no llevan indicador.
- **Historial.** La fecha cruda pasa a «Viernes 25 de septiembre» (con el año si no es el actual); minutos y series con la unidad y el plural; una huella en contorno o rellena según la duración. Sin tarjeta.
- **Tildes.** «Ganar músculo», «Cinco kilómetros», «Siete días», «Treinta días de movimiento», «Completar una sesión», «Veintiún amaneceres», «Lector crítico», «fotográfico», «perfección» (mapa de la vista, `nombresVisibles.ts`); el dato no se toca.
- **«Todos» de la ficha de músculo** (Parte 10, «Trabaja junto a» y «Antagonistas») pasa a `AccionSeccion`, el mismo enlace de texto. Misma acción (`navigate('Tabs', { screen: 'Explorar', … })`).

### 21.7 Observaciones (no son errores del rediseño)

- **BUG-14 a BUG-17** (`docs/BUGS.md`): la sesión abandonada que cuenta como sesión y como día pero no como racha (y por qué el calendario sí la marca), los plurales de Yo (corregidos en la vista), el progreso de los retos que nunca avanza y las fechas de «Últimos 7 días» en UTC.
- **Semana del programa.** `semanaPrograma` es siempre 1, así que «Semana 1 de N» es lo que se ve hasta que se decida cómo avanza (BUG-4).
- **Mediciones en Yo.** No se muestran las registradas (hoy tampoco): el brief las pide «si hoy se muestran», así que no se agregaron.
- **Retos.** El brief define el indicador de tres retos (`ch_001`, `ch_002`, `ch_003`); los demás no llevan (hoy Yo solo muestra los tres primeros).
- **No construido.** Tocar una columna de la gráfica, una medalla o una fila del historial (hoy no hacen nada); deslizar entre meses (hoy solo hay flechas).


## 22. Parte 13: Retos, Mediciones e Historial (auditoría previa)

Tres pantallas del Stack a las que llevan «Ver», «Registrar» y «Ver todo» de la pestaña Yo. Vivían como exportaciones de `src/screens/Yo.tsx`, con el encabezado nativo (`title`) y un `h1` repetido debajo. Lo que sigue es el comportamiento previo al rediseño y no cambia.

### 22.1 Retos

- **Lista.** `RETOS` son 15, en el orden del archivo, todos a la vista. Cada uno trae `name`, `tipo` (constancia, habilidad, rendimiento), `duracion_dias` (o `null` en «Cien sesiones»), `objetivo` (la meta en palabras), `dificultad` (1 a 3), `desc` y `recompensa` (un logro). Cinco citan un programa o una rutina (`ch_004`, `ch_007`, `ch_008`, `ch_009` y `ch_010`) y no se muestran.
- **Tarjeta previa.** Nombre, «Nivel N» en un chip, `desc`, `objetivo`, chips «N días» (solo si hay duración) y `tipo` crudo («constancia»), y abajo un botón azul de ancho completo.
- **«Empezar reto».** Llama a `iniciarReto(id)`, que guarda `retos[id] = { iniciado: hoy(), progreso: 0 }` sin más. El reto pasa a «En curso» (un punto que pulsa y el texto en azul) y **el botón desaparece**: no hay forma de dejarlo. Se pueden tener **varios retos en curso a la vez** (cada uno es independiente). El tipo guarda un `completado?` que **nada escribe** nunca, así que «completado» no existe todavía; el `progreso` tampoco avanza (BUG-16).
- **Texto de introducción.** «Ningún reto empuja a entrenar más días seguidos de los razonables, y los de constancia cuentan los días de movilidad como válidos.» (una `Nota`).

### 22.2 Mediciones

- **Lista.** `MEDICIONES` son 8 protocolos (estatura, test de pared de 4 puntos, foto de perfil para el motor facial, circunferencias, peso, test de rendimiento, cadencia y frecuencia cardiaca en reposo). Cada uno trae `name`, `frecuencia` («cada 4 semanas», «semanal» u «opcional»), `instrumento`, `condiciones_fijas`, `pasos` (solo cinco: no los traen las circunferencias, el peso ni el test de rendimiento), `advertencia`, `interpretacion` y, según el caso, `puntos`, `pruebas`, `puntuacion`, `desactivable` y `nota_de_diseno`. La pantalla solo muestra `name`, `frecuencia`, `condiciones_fijas`, `pasos`, `advertencia` e `interpretacion`.
- **Tocar uno** lo abre **en su lugar** (una `Pressable` con `accessibilityState.expanded`); solo puede haber uno abierto (tocar otro cierra el anterior) y tocar el mismo lo cierra. El nombre iba a la izquierda y la frecuencia a la derecha, sin recorte: un nombre largo («Foto de perfil para el motor facial») la pisaba.
- **Abierto:** «Condiciones fijas» (un punto medio por línea), «Pasos» (numerados por el propio código), la advertencia en una `Nota` de cuidado, la interpretación en texto azul (el «margen de error») y, salvo en `med_003` y `med_006`, el campo «Valor» y «Guardar». **Un solo `valor` de texto** se comparte entre todos los protocolos (BUG-18).
- **Validación.** `parseFloat(valor.replace(',', '.'))`: si no es un número finito, **no pasa nada** (sin mensaje). No hay unidad en el dato: se guarda `unidad: ''`.
- **«Guardar».** Pide el consentimiento de datos de salud (`pedirConsentimientoMedidas`); con él (o si ya lo había) llama a `guardarMedicion({ protocolo, fecha: hoy(), valor, unidad: '' })` y vacía el campo.
- **Dónde se ven los guardados:** solo en una línea bajo el título de la tarjeta, «N registro(s) · último: X» (sin fecha ni lista). Las mediciones también entran en el respaldo y se borran con «Retirar consentimiento».

### 22.3 Historial

- **Datos.** Cada sesión (`SesionGuardada`): `fecha` («2026-09-25»), `estado` (`completada` o `abandonada`), `duracionS`, `series` (con `ejercicioId` y `omitida`), `motivoAbandono` (o `null`), `kcal` y `rpe`.
- **Orden y tamaño.** La lista completa, de la más reciente a la más antigua (`[...sesiones].reverse()`), sin paginación ni virtualización (un `ScrollView`).
- **Tarjeta previa.** La fecha cruda, un chip «Completa» (resaltado) o «Parcial», «Duración N min», «Series N» (las no omitidas), «Salió por: {valor crudo}» si hay motivo y hasta **6 chips de ejercicios** distintos, cada uno tocable (`navigate('Ejercicio', { id })`). La tarjeta en sí no es tocable. Sin sesiones: «Aún no hay sesiones registradas.»
- **Valores internos.** `estado`: `completada` → «Completa», `abandonada` → «Parcial». `motivoAbandono`: los cinco ids de la hoja de salida (`HojaSalida.tsx`): `sin_tiempo` («No tengo tiempo hoy»), `muy_dificil` («Está muy difícil»), `muy_facil` («Está muy fácil»), `molestia` («Me molesta algo») y `sin_ganas` («Hoy no»). La pantalla mostraba el **id crudo**.
- **«Parcial»** significa aquí «sesión incompleta», y en las fichas es el veredicto científico de la evidencia: dos cosas distintas con la misma palabra.

### 22.4 Valores internos mostrados crudos en la app (reporte)

- Historial: `motivoAbandono` («muy_dificil»). **Corregido en la vista.**
- Retos: `tipo` («constancia»). **Corregido en la vista.**
- Mediciones: `frecuencia` («cada 4 semanas», en minúscula). **Corregido en la vista.**
- Pantalla `Logros` (Parte 14 o posterior): `categoria` («constancia», «postura», «programacion», «mandibula»).
- `Ajustes` (Parte 14): el espacio de entrenamiento se ve como «minimo», «colchoneta», «amplio» (corregido en la vista; ver §23). *Corrección posterior:* `nombreGoal` **sí** trae tilde («Ganar músculo») porque `GOALS` ya la lleva en el dato.

### 22.5 Registro de la Parte 13

«código» = lectura de código, `tsc`, `lint:color` y las suites; nada se ha corrido en dispositivo.

| Punto | Estado |
|---|---|
| «Empezar reto» llama a `iniciarReto(id)` y deja el reto «En curso» como antes; los 15 retos salen en el mismo orden | ✅ código |
| Cada protocolo se abre en su lugar, uno a la vez; el valor se valida igual (`parseFloat`, coma o punto), pide el mismo consentimiento y guarda con `guardarMedicion({ …, unidad: '' })` | ✅ código |
| El historial muestra las mismas sesiones, la más reciente primero, con los mismos datos; los chips de ejercicio siguen abriendo `Ejercicio` | ✅ código |
| La meta que se dibuja de cada reto (7 circulos, rejilla de 30 con la meta en 20, barra de 100 en 10 tramos; sin vista previa si no se puede leer) | ✅ prueba (`test:perfil`, 63) |
| Agrupación del historial por mes sin reordenar; motivos de salida, estado, frecuencias, unidades por protocolo y tildes de retos y mediciones | ✅ prueba |
| Meta dibujada que aparece escalonada, huella que se estampa al empezar, riel del historial que se llena, encabezado de mes pegajoso, expansión con altura animada, sacudida y palomita al guardar | pendiente en dispositivo |
| El campo «Valor» sobre el teclado (Android e iPhone) y la lista que se corre al abrir un protocolo | pendiente en dispositivo |
| 60 fps al hacer scroll por un historial largo (el riel usa un estilo animado por fila) | pendiente en dispositivo |
| Lector de pantalla: cada medición anuncia si está abierta o cerrada; el campo dice «Valor, cm» | pendiente en dispositivo |

Suites tras la fase: `test:perfil` 63, `test:aprender` 63, `test:musculos` 43, `test:detallePrograma` 43, `test:detalleRutina` 24, `test:ui` 21, `test:player` 63, `test:engine` 74, `test:rutinas` 31 y `test:borrarTodo` 14, todas en verde; `tsc` solo con los 4 errores previos de `tests/`; `lint:color` sin fugas; `expo export` de Android sin errores.

### 22.6 Cambios de presentación que tocan un texto o una acción visible

No cambian ningún dato ni ruta.

- **Encabezado.** Las tres pantallas dejan el título nativo y el `h1` repetido: un solo título grande de Big Shoulders 800 de 40 que se encoge junto a una flecha de atrás al bajar (`HeaderColapsable` ganó `onAtras`; `PantallaColapsable` es el marco). Las rutas pasan a `headerShown: false`.
- **Retos.** El botón azul de ancho completo pasa a «Empezar reto» compacto (44 de alto) a la derecha. El nivel pasa de un chip a placas con «Nivel N»; los chips «7 días» y «constancia» a una línea con punto («7 días · Constancia»). Cada tarjeta dibuja su meta de antemano (solo los cuatro retos cuya meta se puede leer del dato: «Siete días», «Treinta días de movimiento», «Cien sesiones» y «21 días seguidos»). Un reto en curso lleva un filo azul y **conserva** su «En curso»; uno completado llevaría una medalla, aunque hoy ninguno lo está. Al empezar, el primer elemento de la vista previa se sella con una huella (solo visual: el progreso guardado sigue en 0). La nota de introducción va con barra verde.
- **Mediciones.** El nombre ya no comparte línea con la frecuencia: la frecuencia baja debajo del nombre («Cada 4 semanas», con mayúscula) y el nombre puede ocupar dos líneas. Cada protocolo lleva un icono de línea. Abierto: las condiciones pasan de puntos a una lista de verificación con palomitas, los pasos a una línea de tiempo compacta, la advertencia de un recuadro amarillo a una tarjeta con filo amarillo (con el título «Ten en cuenta», que es texto nuevo) y el margen de error de texto azul a una nota gris con icono de información. El campo «Valor» gana el sufijo de unidad (cm, kg, pasos/min, lpm; solo visual: se guarda `unidad: ''`), el botón «Guardar» pasa a compacto de 56 y **un valor no válido ahora avisa** («Escribe un número.», con sacudida y háptica), en vez de no hacer nada. Al guardar, el valor se estampa y aparece una palomita.
- **Historial.** La fecha cruda pasa a «Viernes 25» bajo un encabezado pegajoso por mes («Septiembre 2026»); cada sesión es una fila sobre un riel con una huella en el nodo. «Parcial» deja el chip (que se confundía con el veredicto científico) por una etiqueta neutra con un círculo a medio llenar; «Muy difícil» reemplaza a `muy_dificil`. Duración y series con números grandes y plural («1 serie»). Los enlaces de ejercicio siguen abriendo la misma ficha (ahora como texto subrayado, no como chips).
- **Tildes.** «cámara», «cardíaca», «están», «guía», «inhalación», «métrica», «superposición» (mapa de la vista); el resto de las de la sección 6 ya estaban.

### 22.7 Observaciones (no son errores del rediseño)

- **BUG-18** (`docs/BUGS.md`): un solo `valor` compartido entre los protocolos de Mediciones y una unidad que nunca se guarda.
- **Unidad de las mediciones.** El dato no trae unidad, así que el sufijo del campo sale de un mapa por protocolo en la vista (`utils/textosVisibles.ts`): estatura y circunferencias en cm, peso en kg, cadencia en pasos/min y pulso en lpm; el test de pared no lleva.
- **Historial largo.** Sigue siendo un `ScrollView` (no virtualiza), como antes; con el riel, cada fila lleva tres estilos animados. Si el desplazamiento no va fluido con cientos de sesiones, el siguiente paso es virtualizar por mes.
- **Retos con programa o rutina** (`ch_004`, `ch_007`, `ch_008`, `ch_009`, `ch_010`): el dato los liga a `pg_` o `rt_` pero la pantalla nunca los mostró; tampoco ahora.
- **«Parcial» con dos significados.** El rediseño los separa visualmente; considera cambiar el texto de la sesión a «Incompleta» (decisión del dueño).
- **No construido.** Tocar una sesión del historial o una tarjeta de reto (hoy no hacen nada).

## 23. Parte 14: Ajustes (auditoría previa)

Una sola pantalla del Stack (`Ajustes`, exportada de `src/screens/Yo.tsx`, a la que lleva la fila «Ajustes» de la pestaña Yo) con el encabezado nativo y un `h1` repetido, y trece bloques en una columna sin forma de ubicarse. Lo que sigue es el comportamiento previo al rediseño y no cambia. **Todo se aplica al tocar**: no hay botón Guardar ni se guarda al salir.

### 23.1 Dónde se guarda cada cosa

- **`perfil.*`** (objetivo, nivel, días, minutos, sin saltos, espacio, equipo, lesiones, vetos, sonido, kcal, peso, estatura): `guardarPerfil(parcial)` mezcla en el estado en memoria al instante y escribe `forja:v1` con un retraso de 350 ms (se agrupa; también al pasar la app a segundo plano). Valores iniciales (`PERFIL_INICIAL`): objetivo `bajar_peso`, nivel 1, 3 días, 20 min, sin saltos apagado, espacio `colchoneta`, equipo `[]`, lesiones `[]`, vetos `[]`, kcal y peso visibles y sonido encendidos; `pesoKg`, `pesoObjetivoKg` y `alturaCm` sin valor.
- **Voz** (`forja:voz`), **vibración** (`forja:haptics`) y **consentimiento de medidas** (`forja:consentimiento_medidas`, `'1'` o la clave borrada): cada uno en su clave de AsyncStorage, al instante. Voz y vibración arrancan encendidas; el consentimiento, apagado (nunca se asume).
- La vibración además se lee de forma síncrona (`hapticosActivos()`): apagarla silencia **toda** la háptica de la app, no solo la de la sesión.

### 23.2 Tu plan

| Control | Tipo | Defecto | Límites | Efecto en el resto de la app |
|---|---|---|---|---|
| Objetivo | Fila con valor (`nombreGoal`). Tocarla **despliega en su lugar** los 8 objetivos (`GOALS`, con su subtítulo); elegir uno llama a `guardarPerfil({ objetivo })` y **la lista se pliega**. Tocar la fila otra vez sin elegir también la pliega | `bajar_peso` | 8 objetivos | Motor de sesión (rotación de patrones), Hoy (sesión, rutinas y programas sugeridos, ejercicios de enfoque), objetivo de una rutina nueva. **No cambia `programaId`** |
| Minutos por sesión | `Contador` (−, número escribible, +), sufijo «minutos» | 20 | 5 a 90, de 1 en 1; escribir acota al terminar | Motor (duración objetivo, calentamiento, cantidad de ejercicios) y el aviso de Hoy si la sesión sale más corta |
| Días por semana | `Contador`, sufijo «días» | 3 | **1 a 7** (el cuestionario permite 2 a 6) | Solo se **muestra** (Plan listo); ningún cálculo lo lee |
| Nivel | 3 chips «Nivel 1 / 2 / 3» | 1 | 1 a 3 | Motor: excluye los ejercicios de nivel mayor (salvo que se relaje el nivel) |

### 23.3 Dónde entrenas

| Control | Tipo | Defecto | Efecto |
|---|---|---|---|
| Modo sin saltos | `Interruptor` con la ayuda «Quita impacto y ruido. Cada rutina tiene su versión silenciosa.» | apagado | Motor y «Puedo hacer» de Explorar quitan lo de impacto o ruido ≥ 2; Hoy solo sugiere rutinas con versión silenciosa; cuenta para el logro «silenciosa» |
| Espacio | 3 chips con el id crudo: `minimo`, `colchoneta`, `amplio` | `colchoneta` | Motor: `minimo` solo deja ejercicios de espacio mínimo; `colchoneta` quita los de espacio amplio |

### 23.4 Equipo

Lista de `EQUIPO` con `onboarding: true` salvo «Sin equipo» (`ninguno`): **19 opciones** (colchoneta, mancuernas, barra olímpica y discos, kettlebell, banda larga, banda circular, barra de dominadas, banco, cuerda, fitball, rodillo, polea, máquina de jalón, prensa, máquina de pecho, máquina de femoral, remo o máquina cardio, chaleco con lastre y anillas o TRX). Cada una es un `Opcion` **de selección múltiple** (marcar añade el id a `perfil.equipo`, desmarcar lo quita; se guarda al instante) con el nombre y, si el dato trae `sustituto_casero`, la línea «Si no tienes: …». Sin equipo, silla y pared cuentan siempre como disponibles (`EQUIPO_BASE`). Efecto: qué ejercicios elige el motor, «Puedo hacer» de Explorar, los ejercicios de enfoque de Hoy y el selector del editor de rutinas.

### 23.5 Lesiones y condiciones

**14 opciones** fijas en el código (cuello, hombro, codo, muñeca, espalda baja, hernia discal, cadera, rodilla, tobillo, mandíbula (ATM), embarazo, postparto, tensión alta y mareos), de selección múltiple sobre `perfil.contra` (se guarda al instante). Encima, la nota «Este filtro nunca se relaja, aunque la app se quede sin ejercicios para un patrón.». Efecto: el motor **nunca** elige un ejercicio con una contraindicación marcada, y Hoy, «Puedo hacer» y la ficha de ejercicio (que lo marca como bloqueado) usan el mismo filtro. El id que cada casilla guarda es el que usan las contraindicaciones del catálogo.

### 23.6 Sesión (bloque «Sonido»)

| Control | Se guarda en | Defecto | Efecto |
|---|---|---|---|
| Tonos durante la sesión | `perfil.sonido` | encendido | Reproductor: tres tonos que suben al final de cada fase y uno distinto al empezar, al terminar la serie y al acabarse el descanso |
| Voz | `forja:voz` | encendida | Reproductor: dice el nombre del ejercicio y sus claves, la cuenta 3-2-1 y cada cambio de fase; mientras habla, «avanzar» se desactiva un instante |
| Vibración (rótulo hoy «Vibracion») | `forja:haptics` | encendida | Toda la háptica de la app (`theme/haptics.ts`), no solo la de la sesión |

No hay más ajustes de sesión en esta pantalla (los ajustes de máquina viven en `forja:ajustes_maquina` y se editan en el editor previo de cada ejercicio).

### 23.7 Qué quieres ver, peso y medidas

| Control | Se guarda en | Defecto | Efecto |
|---|---|---|---|
| Estimación de calorías | `perfil.mostrarKcal` | encendida | Resumen de la sesión y detalle de rutina muestran o no las kcal |
| Peso y medidas corporales | `perfil.mostrarPeso` | encendida | **Solo muestra u oculta el bloque «Peso (opcional)» de esta misma pantalla**; ninguna otra lo lee (BUG-20) |
| Guardar peso y medidas | `forja:consentimiento_medidas` | apagado | Encender: da el consentimiento al instante. Apagar: pide «Retirar consentimiento» y, si se acepta, **borra** peso, peso objetivo, estatura y todas las mediciones (`borrarMedidas`) y retira el permiso; cancelar no cambia nada |
| Peso (opcional), «kg ahora» y «kg objetivo» | `perfil.pesoKg`, `perfil.pesoObjetivoKg` | sin valor (el contador muestra 70; el objetivo, el peso ahora o 70) | 30 a 200, de 1 en 1. Cada cambio pasa por el consentimiento: sin él aparece el diálogo «Guardar peso y medidas» (Cancelar, «Ver aviso de privacidad», «Acepto y guardar»); solo «Acepto» da el permiso **y** guarda el valor. El peso alimenta la estimación de kcal |
| Estatura (opcional) | `perfil.alturaCm` | sin valor (el contador muestra 170) | 120 a 220, de 1 en 1, con el mismo consentimiento. «Dato de tu perfil. No se usa en ningún cálculo del plan.» |

**Qué depende de qué.** El consentimiento **no oculta ni deshabilita nada** en Ajustes: Peso y Estatura se ven siempre (Peso, mientras `mostrarPeso` esté encendido) y lo que hace el consentimiento es interceptar el primer cambio. Lo único que se oculta es «Peso (opcional)» cuando `mostrarPeso` está apagado. Un contador que muestra 70 o 170 **no guarda ese número** hasta que se toca −, + o se escribe.

### 23.8 Ejercicios vetados

Solo aparece si hay al menos un veto: «Ejercicios vetados (N)», un chip por ejercicio (el nombre del catálogo o el id si ya no existe) y «Toca uno para volver a permitirlo.». Tocar un chip lo quita de `perfil.vetos` al instante. Los vetos se ponen desde la ficha del ejercicio. No aparece en la lista de tareas del brief, pero se conserva.

### 23.9 Catálogo

Ocho cifras de solo lectura, calculadas al cargar la app desde los datos (`ESTADISTICAS`): ejercicios, sin equipo (`equipment` incluye `ninguno`), aptos sin saltos (impacto < 2 y ruido < 2), músculos, rutinas, programas, tips y mitos. **Las filas no son tocables.**

### 23.10 Tu cuenta

- **Proveedor y correo.** Con `cuenta.proveedor === 'google'` la fila dice «Google» y el correo; en cualquier otro caso «Sin cuenta» y el nombre de la cuenta (`??`, así que un invitado sin nombre da una cadena vacía) o «Invitado» si no hay cuenta. No se recorta.
- **Cerrar sesión** (solo con Google). Alerta «Cerrar sesión: Tu historial de entrenamiento se queda en este teléfono.» con Cancelar y «Cerrar sesión»; acepta → `salir()` (cierra Google y borra la cuenta local; **no** borra el progreso).
- **Eliminar mi cuenta.** Llama a `confirmarBorrarTodo` (ver 23.12).

### 23.11 Tus datos

- **Exportar mi progreso.** `exportarProgreso()`: junta las seis claves `forja:*` (estado, sesión en curso, máquina, voz, vibración y cuenta; **no** el consentimiento de medidas) en un JSON (`formato` 1, fecha, versión de la app), lo escribe en el caché y abre «Compartir». Mientras trabaja el botón muestra «Exportando…». Sin compartir disponible o con un fallo: alerta «No se pudo exportar» con el motivo. Éxito: solo se ve la hoja del sistema.
- **Importar progreso.** Abre el selector de archivos (JSON) y **valida antes de escribir**: `formato` distinto, sin el estado de entrenamiento, valor que no es texto o JSON dañado → alerta «Archivo no válido» con el motivo; cancelar el selector no hace nada. Mientras lee muestra «Leyendo archivo…». Si es válido, alerta «Importar progreso: Esto reemplaza tu progreso actual. No se puede deshacer.» (Cancelar / «Importar»). Aceptar escribe las claves (sin tocar la cuenta) y avisa «Progreso importado: cierra la app por completo y vuelve a abrirla…»; si falla, «No se pudo importar: … Tus datos actuales no deberían haber cambiado».
- Texto: «Todo vive en este teléfono, sin copia en la nube. Exporta un archivo para guardarlo tú o pasarlo a otro teléfono.»

### 23.12 Legal y borrado

- **Aviso de privacidad** y **Términos y condiciones**: `Linking.openURL` a las páginas de `src/legal.ts` (fuera de la app). Sin confirmación.
- **Borrar cuenta y datos** (en Legal): **solo abre `URL_BORRAR_CUENTA`** (la página web de borrado). No borra nada en el teléfono ni pide confirmación.
- **Eliminar mi cuenta** (en Tu cuenta) y **Borrar todos mis datos** (botón rojo al final de la pantalla): **los dos llaman a la misma función**, `confirmarBorrarTodo`. Alerta «Borrar mis datos: Se borrarán tu cuenta, tu progreso, rutinas, medidas y ajustes de este teléfono. No se puede deshacer.» con Cancelar, «Exportar respaldo primero» (solo exporta; no borra y no vuelve a preguntar) y «Borrar todo» → `borrarTodosLosDatos()`: barre las claves `forja:*` de AsyncStorage, borra los respaldos del caché, reinicia el progreso en memoria (cancelando la escritura diferida) y cierra la sesión de Google. Funciona con o sin cuenta.
- Al final, el aviso «Contenido educativo y de entrenamiento. No sustituye diagnóstico ni consejo médico, fisioterapéutico o nutricional individual.». La pantalla no muestra la versión de la app.

### 23.13 Tres acciones de borrado, dos iguales (reporte)

Son **tres** entradas, no dos: dos borran lo mismo en el teléfono y la tercera solo abre una página web. Ver BUG-19.

### 23.14 Valores internos mostrados crudos (reporte)

- Espacio: «minimo», «colchoneta», «amplio». **Corregido en la vista.**
- Sonido: el rótulo «Vibracion». **Corregido.**
- Los nombres de equipo, de objetivo y de lesiones ya vienen con tilde en el dato (se corrigieron en las Partes 2 y 3), así que `nombreGoal` **no** se ve sin tildes como decía §22.4: esa línea era inexacta.

### 23.15 Registro de la Parte 14

«código» = lectura de código, `tsc`, `lint:color` y las suites; nada se ha corrido en dispositivo.

| Punto | Estado |
|---|---|
| Cada ajuste guarda el mismo campo, al instante, con los mismos límites (5 a 90, 1 a 7, 30 a 200, 120 a 220) | ✅ código |
| Equipo (19) y lesiones (14): mismas opciones, selección múltiple y ids | ✅ código |
| Consentimiento: los mismos diálogos, el mismo borrado al retirarlo y el mismo bloque oculto con `mostrarPeso` | ✅ código |
| Cerrar sesión, Exportar, Importar, Aviso, Términos, Borrar cuenta y datos y las dos entradas de «Borrar todo» hacen lo mismo, con los mismos textos y salidas | ✅ código |
| Las opciones que se ofrecen son las que el resto de la app entiende: las 14 lesiones son exactamente las contraindicaciones que citan los ejercicios; los 3 espacios son los del catálogo; 19 equipos del cuestionario; contadores «N de 19» y «N marcadas» | ✅ prueba (`test:ajustes`, 24) |
| Tildes de lo que se ve (equipo, alternativas, objetivos, espacios, lesiones) | ✅ prueba |
| Indice de secciones que marca la sección visible y lleva a cada una; el dial de minutos y la regla de estatura; casillas con palomita, nube de 6 partículas y alternativa atenuada; catálogo que rueda una vez; hoja de confirmación con foco en «Cancelar» | pendiente en dispositivo |
| El campo numérico de los contadores (escribir el número) con el teclado abierto en las secciones de abajo (Peso, Estatura) | pendiente en dispositivo |
| 60 fps al recorrer la pantalla completa (≈60 filas, cada casilla con 3 estilos animados) en Android de gama media | pendiente en dispositivo |
| Lector de pantalla: cada interruptor y casilla anuncia nombre y estado; lesiones dicen «filtro de seguridad» | pendiente en dispositivo |
| Reducir movimiento: índice sin animar el scroll, sin odómetro, dial ni regla, sin partículas, palomitas completas, interruptores con fundido de 120 ms, bloque de peso sin animar la altura | pendiente en dispositivo |

Suites tras la fase: `test:ajustes` 24, `test:perfil` 63, `test:aprender` 63, `test:musculos` 43, `test:detallePrograma` 43, `test:detalleRutina` 24, `test:ui` 21, `test:player` 63, `test:engine` 74, `test:rutinas` 31 y `test:borrarTodo` 14, todas en verde; `tsc` solo con los 4 errores previos de `tests/`; `lint:color` sin fugas; `expo export` de Android sin errores.

### 23.16 Cambios de presentación que tocan un texto o una acción visible

No cambian ningún dato, límite ni ruta.

- **Encabezado.** El título nativo y el `h1` repetido pasan a un solo título grande que se encoge junto a la flecha de atrás (`PantallaColapsable`); la ruta pasa a `headerShown: false`. Nuevo: una fila de chips pegajosa («Tu plan», «Dónde entrenas», «Equipo», «Lesiones», «Sesión», «Qué ver», «Peso y medidas», «Catálogo», «Cuenta», «Datos», «Legal») que solo se desplaza; no cambia ningún ajuste.
- **Textos.** La sección «Sonido» pasa a «Sesión»; «Vibracion» pasa a «Vibración»; el espacio deja de verse como id crudo («minimo») y pasa a «Mínimo / Colchoneta / Amplio». «Peso (opcional)» y «Estatura (opcional)» dejan de ser secciones y pasan a subtítulos dentro de «Peso y medidas». Nuevo texto: el título «Filtro de seguridad» de la nota de lesiones (antes sin título).
- **Controles.** Los `Interruptor` pasan al interruptor de DARENOW (con la descripción completa y un icono); el nivel pasa de chips a tres placas de altura creciente; el espacio, de chips a un control segmentado; los minutos ganan un dial que refleja el valor sobre 90; los días por semana usan el mismo contador y la semana de siete placas del cuestionario (con su texto «Tú decides qué días; esto solo es cuántos.», que hasta ahora no se veía aquí); la estatura gana una regla decorativa. Equipo y lesiones pasan de una tarjeta por opción a una lista agrupada con casilla de 24 px (magnesia en equipo; amarilla con filo en lesiones, sin partículas) y un contador («3 de 19», «2 marcadas»).
- **Objetivo.** La fila sigue desplegando los 8 objetivos en su lugar y eligiendo uno los pliega; ahora la fila lleva el icono y el chevron gira, y el elegido se marca con una palomita.
- **Vibración.** Al **encenderla** suena una háptica Medium de muestra.
- **Catálogo.** La tabla pasa a una rejilla de 2 columnas cuyos números ruedan desde 0 la primera vez que la sección entra en pantalla. Las filas no eran tocables y siguen sin serlo.
- **Botones → filas.** «Cerrar sesión», «Eliminar mi cuenta», «Exportar mi progreso», «Importar progreso», «Aviso de privacidad», «Términos y condiciones», «Borrar cuenta y datos» y «Borrar todos mis datos» dejan de ser botones de ancho completo (beige o fantasma rojo) y son filas de una lista agrupada; los que borran van en rojo con papelera. Los de Legal muestran el icono de enlace externo. Mientras exporta o lee el archivo, el icono pulsa y el texto «Exportando...» / «Leyendo archivo...» toma el lugar de la descripción.
- **Confirmaciones.** Las cuatro alertas del sistema (retirar consentimiento, cerrar sesión, borrar mis datos e importar) pasan a una hoja inferior con **el mismo título, el mismo texto y las mismas salidas**; las acciones van arriba (la destructiva en rojo sólido) y «Cancelar» abajo, donde empieza el foco del lector de pantalla. Las alertas de error o éxito (no se pudo exportar, archivo no válido, progreso importado, no se pudo importar) siguen siendo alertas del sistema, con una háptica de error o de éxito. El diálogo de consentimiento de peso y medidas (`pedirConsentimientoMedidas`) no se toca.
- **«Borrar cuenta y datos».** Sigue abriendo la página web sin confirmar (ver BUG-19); se dibuja en rojo con el icono de enlace, no como papelera con hoja de confirmación.

### 23.17 Observaciones (no son errores del rediseño)

- **BUG-19** y **BUG-20** (`docs/BUGS.md`).
- **Más opciones que las del brief.** Equipo son **19** (el brief decía ≈18, y el contador se calcula del dato) y las lesiones **14** (≈11). Se conservaron tres bloques que el brief no lista: «Peso (opcional)» (peso ahora y peso objetivo), «Ejercicios vetados» (solo si hay) y el botón «Borrar todos mis datos» del final, más el aviso de contenido educativo.
- **El consentimiento de medidas no entra en el respaldo.** `exportarProgreso` guarda seis claves y no `forja:consentimiento_medidas`: al importar en otro teléfono, el peso y las mediciones llegan pero el permiso queda apagado y se vuelve a pedir en el primer cambio. Es el comportamiento de siempre.
- **El contador muestra un número que no está guardado.** Sin peso o estatura guardados el contador enseña 70 o 170; nada se guarda hasta que se toca − o + o se escribe.
- **Los estados de éxito y de error de exportar e importar son alertas del sistema**, como antes; el brief pedía palomita y texto rojo «solo si hoy existen esos estados», y no existen dentro de la pantalla, así que no se añadieron.
- **Sin virtualización.** La pantalla lleva unas 60 filas y cada casilla tiene tres estilos animados; si el desplazamiento no va fluido en un Android de gama media, el siguiente paso es dibujar Equipo y Lesiones sin animar las filas fuera de pantalla.
- **La versión de la app no se muestra hoy y no se añadió.**
- **No construido.** Tocar una cifra del catálogo (hoy no hace nada).

