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
2. `intro_01`: «Entrena lo que tú quieras trabajar». Cuerpo con `ESTADISTICAS.ejercicios`. Pie con `ESTADISTICAS.sinEquipo`.
3. `intro_02`: «La sesión cabe en tu tiempo». Pie: «Nada de rachas que se rompen y castigan.»
4. `intro_03`: «Te decimos lo que sí funciona, y lo que no». Pie con `ESTADISTICAS.mitos`.

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

Único control: **Entrar** → `marcarBienvenida()` (guarda `bienvenidaVista = hoy()`) y luego `navigation.replace('Tabs')`.

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
| Arranque y orden Presentacion → Acceso → Onboarding → Bienvenida/Tabs | ✅ | ✅ | ✅ | | | | |
| Seguir / Empezar / Saltar de Presentacion | ✅ | ✅ | ✅ | | | | |
| Acceso (Google, invitado, enlaces legales) | ✅ | ✅ | ✅ | | | | |
| Onboarding: pasos, omisiones, obligatorios, consentimiento, resumen | ✅ | ✅ | ✅ | | | | |
| Entrar en Bienvenida (marca y navega a `Tabs`) | ✅ | ✅ | ✅ | | | | |
| Nombre, fecha, racha, sesiones, días entrenados | ✅ | ✅ | ✅ | | | | |
| Mensaje del día y su imagen | ✅ | ✅ | ✅ | | | | |
| Las 4 pestañas y sus saltos | ✅ | ✅ | ✅ | | | | |
| Persistencia (onboarding no reaparece) | ✅ | ✅ | ✅ | | | | |
| Ajuste de háptica respetado | ✅ | ✅ | ✅ | | | | |
