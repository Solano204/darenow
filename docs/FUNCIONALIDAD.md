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
- Hoy: buscar → `Tabs/Explorar`; avatar → `Tabs/Yo`; sesión del día y rutina rápida → `Reproductor {sesion}`; ejercicio → `Ejercicio {id}`; programa → `Programa {id}`; «ver más» → `Tabs/Explorar {tab: rutinas|programas|ejercicios|musculos}` (merge); `Musculo {id}`; `Tip {id}`; `Tabs/Aprender`.
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
