# Errores detectados (sin corregir)

> **Rutas:** este documento se escribió antes de la reorganización R2. La equivalencia de cada ruta citada (`src/screens/…`, `src/components/…`, `src/store/…`) está en `docs/perf/R2_MOVIMIENTOS.md`, y la estructura actual en `docs/ARQUITECTURA.md`.

Encontrados al auditar la sesión de entrenamiento (Parte 4, BUG-1 a BUG-7), Explorar (Parte 6, BUG-8 y BUG-9) el editor de rutinas (Parte 7, BUG-10 y BUG-11), el detalle de rutina (Parte 8, BUG-12), la ficha de músculo (Parte 10, BUG-13) la pestaña Yo (Parte 12, BUG-14 a BUG-17) Mediciones (Parte 13, BUG-18) y Ajustes (Parte 14, BUG-19 y BUG-20). **Ninguno está corregido**: el rediseño no cambia funcionalidad y la corrección de cada uno espera la aprobación del dueño. Ninguno bloquea el rediseño.

## BUG-1. «Programa completo» se otorga con la primera sesión guardada, aunque no se haya hecho nada

**Síntoma (captura del resumen).** Se sale en el ejercicio 1 y el resumen muestra Duración 0 min, Series 0, Ejercicios 0, 0 días seguidos y, aun así, «Nuevo logro: Programa completo — Terminaste un programa entero de principio a fin».

**Causa.** `src/store/store.ts`, `guardarSesion`, línea 343:

```ts
if (sesiones.length >= 1) otorgar('logro_programa1');
```

`sesiones` ya incluye la sesión que se acaba de guardar, así que la condición se cumple con la primera sesión de la vida del usuario, sea `completada` o `abandonada` y tenga 0 series. Nada en la condición mira un programa: no hay ningún seguimiento de «programa terminado» en el estado (ver BUG-4).

**Efectos relacionados en la misma función.**
- Una sesión sin ninguna serie real se guarda igual y suma a `sesiones.length` (logros `logro_100sesiones` y `logro_365sesiones`) y a los días distintos del mes (`logro_030dias`).
- La racha no se ve afectada: `cuenta = reales.length >= 1` la protege, por eso muestra 0.

**Propuesta.** Separar dos cosas:
1. El logro solo con una sesión que cuente: exigir `cuenta` (al menos una serie no omitida) para los logros por número de sesiones y por días.
2. `logro_programa1` solo cuando se termine de verdad un programa: requiere primero que exista el avance de semanas (BUG-4) y otorgarlo cuando la última sesión completada cierre la última semana de `perfil.programaId`.

Hasta entonces, la corrección mínima es condicionar la línea 343 a `s.estado === 'completada'` con un contador propio de programas completados, o quitarla.

## BUG-2. «Cuenta igual para tu racha» aparece aunque la sesión no cuente

**Síntoma.** El resumen de una sesión abandonada dice «Cuenta igual para tu racha. Lo que hiciste, hecho está.» aunque no se haya hecho ninguna serie y la racha quede como estaba (0).

**Causa.** `src/screens/Resumen.tsx`: el texto se muestra siempre que `!completada`. La regla real está en `guardarSesion` (`cuenta = reales.length >= 1`).

**Propuesta.** Mostrar el texto solo si hay al menos una serie no omitida; con 0 series, decir otra cosa («No llegaste a hacer ninguna serie, así que hoy no suma a la racha.»), sin culpa.

## BUG-3. «Cómo se sintió» no se guarda

**Síntoma.** El resumen pide elegir cómo se sintió y dice «Con esto ajustamos la carga de la próxima.»

**Causa.** `Resumen.tsx` guarda la elección en un `useState` local (`rpe`). La sesión ya se guardó en el reproductor con `rpe: null` (`Reproductor.tsx`, `finalizar`), y nada la actualiza después. Tampoco hay lector: ninguna otra parte del código usa `SesionGuardada.rpe`. El texto promete un ajuste de carga que no existe.

**Propuesta.** Un `actualizarRpe(idSesion, rpe)` en el store llamado al elegir y, si se quiere cumplir el texto, que el motor lo lea; si no, quitar la frase. Es decisión de producto.

## BUG-4. El programa activo nunca avanza de semana

**Síntoma.** «Tu programa» en Hoy siempre dice «Semana 1 de N».

**Causa.** `semanaPrograma` solo se asigna en `estadoInicial.ts` (valor 1). Ningún código lo cambia. Sin ese avance no hay forma de saber que un programa se terminó (ver BUG-1).

**Propuesta.** Avanzar la semana al cumplir los días por semana del programa (`Programa.dias_semana`) y marcar el programa como terminado al pasar de `Programa.semanas`.

## BUG-5. «Terminar antes» no registra la serie

**Síntoma.** En un ejercicio por tiempo, «Terminar antes» pasa a la fase siguiente, pero la serie no cuenta: no sale en «Series» ni en «Ejercicios» del resumen y no se puede deshacer.

**Causa.** `src/session/playerMachine.ts`, `case 'avanzar'` devuelve `siguiente(e)` sin añadir a `hechas` (a diferencia del fin natural del tiempo, `registrar` y `omitir`, que sí registran y guardan `anterior`). El botón llama a `avanzar`.

**Propuesta.** En `trabajo`, que `avanzar` registre la serie con los segundos realmente trabajados (`segPlan - restanteS`).

## BUG-6. «Omitir este ejercicio» solo omite la serie actual

**Síntoma.** El botón dice «este ejercicio», pero en un ejercicio de 3 series omite una y vuelve a preparar la siguiente serie del mismo ejercicio.

**Causa.** `playerMachine.ts`, `case 'omitir'`: registra una serie omitida y llama a `siguiente`, que avanza de serie, no de ejercicio.

**Propuesta.** O renombrar el botón («Omitir esta serie») o hacer que omita las series restantes del ejercicio. Cambia el texto o el comportamiento: decisión del dueño.

## BUG-7. «Ya entrenaste hoy» aparece con una sesión de 0 series

**Síntoma.** Salir en el ejercicio 1 y volver a Hoy muestra «Ya entrenaste hoy» y «Hecho hoy».

**Causa.** `Hoy.tsx` calcula `entrenoHoy` con `sesiones.some(s => s.fecha === hoy())` (comportamiento anterior al rediseño): cuenta cualquier sesión guardada, aunque tenga 0 series. Es la misma raíz que BUG-1.

**Propuesta.** Contar solo sesiones con al menos una serie no omitida (la misma regla que la racha).

## BUG-8. La búsqueda no encuentra lo que se ve

**Síntoma.** En Explorar, escribir «flexión» (con tilde, como se ve en pantalla) no devuelve ningún ejercicio; «flexion» sí. Con «isométrica», «estática», «músculo», «mandíbula» y el resto de nombres con tilde pasa lo mismo.

**Causa.** El catálogo (`assets/data/*.json`) está escrito sin tildes y `Explorar.tsx` compara `name.toLowerCase().includes(q.trim().toLowerCase())` sin normalizar. Hasta las Partes 3 a 6 la pantalla mostraba también el nombre sin tilde, así que lo que se veía coincidía con lo que se buscaba. Las tildes se añaden ahora solo al mostrar (`data/nombresVisibles.ts`), y desde entonces lo que se ve y lo que se compara ya no son lo mismo. Se aplica a los cuatro segmentos y al buscador del editor de rutinas.

**Propuesta.** Quitar las tildes a los dos lados antes de comparar (`texto.normalize('NFD').replace(/[̀-ͯ]/g, '')`), en una función común (`utils/presentacion.ts`) usada por Explorar y por el buscador del editor. No cambia ningún dato ni identificador y devuelve un resultado más (nunca menos) que hoy. Cambia el comportamiento de la búsqueda: decisión del dueño.

## BUG-9. «Ver todas» no siempre cambia de segmento

**Síntoma.** Desde Hoy se pulsa «Ver todas» de rutinas y se abre Explorar en Rutinas. El usuario pulsa a mano «Ejercicios», vuelve a Hoy y pulsa «Ver todas» de rutinas otra vez: Explorar se queda en Ejercicios.

**Causa.** Hoy navega con `navigate('Tabs', { screen: 'Explorar', merge: true, params: { tab } })`. `Explorar.tsx` reacciona al cambio del parámetro (`useEffect` con `[route.params.tab]`), pero el cambio manual de segmento solo actualiza el estado local y el parámetro sigue valiendo `'rutinas'`; al pulsar lo mismo, el valor no cambia y el efecto no se dispara. Es el mismo caso de las fichas de músculo y programa y de Favoritos.

**Propuesta.** Borrar el parámetro una vez consumido (`navigation.setParams({ tab: undefined })` dentro del efecto) o guardar en él un identificador que cambie en cada navegación. Cambia la navegación: decisión del dueño.

## BUG-10. Una rutina vacía dura «1 minutos»

**Síntoma.** En el editor de rutinas, con 0 ejercicios (o con ejercicios de 0 series) el resumen dice «1 minutos».

**Causa.** `src/engine/session.ts`, `minutosPropios`, última línea: `return Math.max(1, Math.round(total / 60))`. El mínimo de 1 es artificial: una rutina vacía dura 0. La misma función alimenta el resumen del editor, la fila de «Mis rutinas», `RutinaPropia` y la tarjeta de Hoy.

**Lo que sí se corrigió (presentación).** La concordancia: la pantalla dice «1 minuto» y «1 ejercicio» con `plural()`, sin tocar el cálculo.

**Propuesta.** Devolver 0 cuando no hay trabajo y dejar el mínimo de 1 solo donde una rutina real dura menos de medio minuto, o que la pantalla no muestre minutos cuando `items.length === 0`. Cambia un número que ven varias pantallas: decisión del dueño.

## BUG-11. Cancelar la edición de una copia no la borra

**Síntoma.** En el detalle de una rutina del catálogo, «Duplicar y editar» abre el editor; al cancelar («Descartar») la copia «{nombre} (copia)» queda en «Mis rutinas».

**Causa.** `Detalles.tsx`, `duplicarYEditar`, llama a `guardarRutinaPropia(copia)` antes de `navigate('EditorRutina', { id })`. El editor asume que lo que recibe ya existe, así que «Cancelar» solo descarta los cambios hechos después.

**Propuesta.** Pasar la copia como borrador al editor (sin guardarla) y guardarla solo en «Guardar cambios», como una rutina nueva. Cambia el flujo: decisión del dueño.

## BUG-12. Las «vueltas» del detalle de rutina no se cumplen en la sesión

**Síntoma.** El detalle de `rt_001` dice «Principal · 3 vueltas» con cinco ejercicios, pero al tocar «Empezar esta rutina» el reproductor recorre los cinco una sola vez (cada uno con sus series por defecto). Lo mismo pasa con `rt_002`, `rt_003`, `rt_004`, `rt_011`, `rt_012` y `rt_030`. «Duplicar y editar» también las pierde: la copia es una lista plana.

**Causa.** `src/engine/session.ts`, `sesionDeRutina` (líneas 311 a 325): itera `b.items` una vez por bloque y ni siquiera lee `b.vueltas` (su tipo es `{ tipo: string; items: string[] }[]`). `minutosEstimados` sale de esos mismos ítems, así que tampoco coincide con los `min` del bloque. En `Detalles.tsx`, `duplicarYEditar` hace `flatMap` de `items` sin mirar las vueltas.

**Propuesta.** Decidir con el dueño qué significa «vuelta» frente a «serie» (¿una vuelta es una pasada por todo el bloque, y entonces la serie por ejercicio vale 1?). Si es una pasada, repetir los ítems del bloque `vueltas` veces al armar la sesión y en la copia, y calcular los minutos con eso. Cambia el contenido de la sesión: decisión de producto.

## BUG-13. Músculos relacionados que no existen en el catálogo

**Síntoma.** En la ficha de `deltoide_lateral`, `deltoide_posterior`, `trapecio_superior`, `trapecio_inferior`, `recto_abdominal` y `oblicuo_externo`, una de las fichas de «Trabaja junto a» o «Antagonistas» muestra el id crudo («supraespinoso», «infraespinoso», «elevador_escapula», «oblicuos», «oblicuo_interno_contralateral») sin imagen. Al tocarla se abre `Musculo { id }` con un id que no existe y la pantalla queda en blanco.

**Causa.** `assets/data/01_muscles.json`: `trabaja_con` y `antagonista` de esos seis músculos citan ids que no están entre los 52 (`supraespinoso`, `infraespinoso`, `elevador_escapula`, `oblicuos`, `oblicuo_interno_contralateral`). La ficha hacía `musculoPorId.get(x)?.name ?? x` y `push('Musculo', { id })` sin comprobar que existiera.

**Lo que se hizo en la vista.** La ficha nueva sigue mostrando ese músculo, con el nombre legible («Supraespinoso») y sin imagen, pero ya no se puede tocar: no hay nada que abrir.

**Propuesta.** Completar el catálogo con esos cinco músculos (con su imagen, su función y su «lo que suele pasar»), o quitar esos ids del dato. Es contenido: decisión del dueño.

## BUG-14. Una sesión abandonada sin series cuenta como sesión y como día, pero no como racha

**Síntoma (pestaña Yo tras salir en el ejercicio 1).** «1 sesiones», «0 minutos», «0 series», racha 0, el historial dice «0 min · 0 series» y el calendario cuenta «1 días este mes» y «1 días en total».

**Causa.** Es la misma raíz de BUG-1 y BUG-7. `guardarSesion` (`store.ts`) guarda la sesión aunque no tenga ninguna serie real: solo la racha mira `reales.length >= 1`. Todo lo demás lo cuenta:
- `estadisticas(sesiones).total` es `sesiones.length`, sin filtrar.
- `diasEntrenados` y `minutosPorDia` toman la fecha de cualquier sesión guardada, así que el calendario marca el día y «días este mes» / «días en total» lo suman.

**El calendario sí marca el día (no falta la marca, ni el conteo está mal).** Con 0 minutos la sesión cae en «sesión corta» y el calendario anterior la pintaba con un tinte azul pálido y un borde fino, casi igual al anillo de «hoy»; además, un día de hoy **con** sesión perdía su anillo (solo se dibujaba `esHoy && !marcado`). Por eso el 25 se veía «solo como hoy». El calendario nuevo dibuja el anillo de hoy siempre y, debajo del número, una huella en contorno.

**Propuesta.** La misma de BUG-1 y BUG-7: contar como sesión y como día solo lo que tenga al menos una serie no omitida. Cambia números que ven varias pantallas: decisión del dueño.

## BUG-15. Plurales en la pestaña Yo («1 sesiones», «1 días»)

**Síntoma.** Con una sola sesión Yo decía «1 sesiones» (etiqueta fija), el calendario «1 días este mes» y «1 días en total» (fijas) y el historial «1 series».

**Lo que se corrigió (presentación).** Yo usa `plural()` en las cuatro placas, en el resumen del calendario y en el historial («1 sesión», «1 día este mes», «1 serie»). No toca ningún cálculo. Se lista aquí porque el brief pide reportarlo.

## BUG-16. El progreso de un reto nunca avanza

**Síntoma.** «Empezar reto» deja el reto «En curso», pero nada lo hace avanzar: ni «Siete días» cuenta días seguidos ni «Cien sesiones» cuenta sesiones, y ningún reto se completa nunca (tampoco se otorga su logro).

**Causa.** `iniciarReto` (`store.ts`) guarda `retos[id] = { iniciado: hoy(), progreso: 0 }` y ningún otro código escribe `progreso` ni `completado`. `guardarSesion` otorga los logros por número de sesiones y días sin pasar por los retos.

**Efecto en Yo.** Los indicadores de progreso de la tarjeta de cada reto (7 placas, 30 celdas, barra de 100) leen ese dato y, mientras nada lo actualice, muestran siempre 0 de la meta en los retos que ya se empezaron.

**Propuesta.** Derivar el progreso de las sesiones guardadas desde `iniciado` (días seguidos, días con sesión, total de sesiones) o guardarlo en `guardarSesion`. Es lógica nueva: decisión del dueño.

## BUG-17. «Últimos 7 días» calcula las fechas en UTC y «hoy» en hora local

**Síntoma.** En la tarde-noche de un huso al oeste de UTC (México, después de las 18:00), la última columna de «Últimos 7 días» es **mañana** (una columna en cero) y la sesión de hoy queda en la penúltima; el día más antiguo se cae. Pasa igual con la franja de Hoy.

**Causa.** `ultimos7` (`store.ts`) arma cada fecha con `new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)`, que es la fecha en UTC, mientras `hoy()` y `SesionGuardada.fecha` usan la fecha local. Las sesiones se buscan por igualdad de cadena, así que no se pierden, pero la ventana de siete días se corre un día.

**Propuesta.** Construir las siete fechas con el mismo formato local de `hoy()`. Cambia el rango de datos que ven Hoy y Yo: decisión del dueño.

## BUG-18. Mediciones comparte un solo valor entre todos los protocolos y nunca guarda la unidad

**Síntoma.** En Mediciones se escribe «72» en «Peso corporal» sin guardar, se abre «Estatura» y el campo ya dice «72»; también al cerrar y abrir otro protocolo. Además, un valor que no es un número (vacío, «abc») no hace nada: sin mensaje.

**Causa.** `Mediciones` (antes en `Yo.tsx`) guarda el texto en un único `useState` (`valor`) fuera de la lista de protocolos, y `Guardar` retorna en silencio si `parseFloat` no da un número finito. Al guardar siempre manda `unidad: ''`, así que `MedicionGuardada.unidad` nunca lleva la unidad (cm, kg, lpm…).

**Lo que se corrigió (presentación).** Un valor no válido ahora avisa («Escribe un número.», con sacudida y háptica) y el campo muestra la unidad del protocolo como sufijo. El estado compartido y el `unidad: ''` **se conservan**: cambiarlos toca lo que se guarda.

**Propuesta.** Un valor por protocolo (o vaciar el campo al cambiar de protocolo) y guardar la unidad de cada uno junto con la medición. Cambia lo que se guarda: decisión del dueño.

## BUG-19. Tres entradas de borrado en Ajustes: dos hacen exactamente lo mismo y la tercera solo abre una página web

**Síntoma.** Ajustes tiene «Eliminar mi cuenta» (en Tu cuenta), «Borrar cuenta y datos» (en Legal) y «Borrar todos mis datos» (botón rojo al final). Por su nombre parecen dos, o tres, formas de lo mismo; no lo son.

**Qué hace cada una (`src/screens/Yo.tsx`, `Ajustes`).**

- **«Eliminar mi cuenta»** y **«Borrar todos mis datos»**: las dos llaman a `confirmarBorrarTodo`. Misma alerta («Borrar mis datos», con Cancelar, «Exportar respaldo primero» y «Borrar todo») y mismo borrado (`borrarTodosLosDatos()`: barre las claves `forja:*`, borra los respaldos del caché, reinicia el progreso y cierra Google). **Son la misma acción con dos botones.**
- **«Borrar cuenta y datos»** (Legal): solo hace `Linking.openURL(URL_BORRAR_CUENTA)`; abre la página web de borrado. No toca el teléfono y no pide confirmación.

**Propuesta.** Dejar un solo botón local (el de Tu cuenta) y renombrar el de Legal para que se entienda que lleva a una página («Solicitar el borrado en la web»). Cambiar botones o textos es decisión del dueño. **Lo que hace el rediseño:** conserva las tres entradas y cada acción exactamente como hoy; «Borrar cuenta y datos» se dibuja como fila roja con un icono de enlace externo (no papelera con hoja de confirmación, porque no borra nada localmente y añadirle una confirmación cambiaría lo que hace); las dos locales usan la misma hoja de confirmación.

## BUG-20. «Peso y medidas corporales» promete ocultarlas de toda la app y solo oculta un bloque de Ajustes

**Síntoma.** El interruptor dice: «Si las apagas, desaparecen de toda la app. El plan funciona igual.». Al apagarlo, Mediciones (con el protocolo de peso y los de circunferencias) y todo lo demás siguen igual.

**Causa.** `perfil.mostrarPeso` solo lo lee `Ajustes` (`{p.mostrarPeso && <Seccion titulo="Peso (opcional)">…}`); ningún otro archivo lo consulta.

**Propuesta.** O leer `mostrarPeso` donde se muestran peso y medidas (Mediciones, Yo), o cambiar el texto a lo que hace hoy. Es lógica nueva o un cambio de texto de producto: decisión del dueño. El rediseño conserva el texto y el comportamiento.
