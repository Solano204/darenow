# FUNCIONALIDAD congelada

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
- «Ejercicios para ti»: la ficha muestra el nivel en placas y la insignia de evidencia pequeña (datos del propio ejercicio, `level` y `evidenciaDe`); «Para leer hoy» muestra la sala con un ícono; la ficha de músculo ya no lleva insignia.
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

