# Errores detectados (sin corregir)

Encontrados al auditar la sesión de entrenamiento (Parte 4). **Ninguno está corregido**: el rediseño no cambia funcionalidad y la corrección de cada uno espera la aprobación del dueño. Ninguno bloquea el rediseño.

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
