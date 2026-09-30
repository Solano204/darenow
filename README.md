# FORJA

App de entrenamiento multi-objetivo.

| | |
|---|---|
| Expo | ~57.0.17 |
| React Native | 0.86.3 |
| React | 19.2.0 |
| TypeScript | ~5.9.2 |

## Arrancar

```bash
npm install
npx expo start
```

QR con Expo Go. Sin backend, sin cuentas, sin internet.

Las versiones del `package.json` son las exactas del SDK 57, así que no hace
falta `--fix`. Si algo falla, mira `INSTALAR.md`.

## Pruebas

```bash
npm run test:player   # 43 · máquina del reproductor
npm run test:engine   # 74 · motor contra el catálogo
npm run test:ui       # 21 · calendario, favoritos, reloj de anuncios
npm run test:rutinas  # 31 · rutinas creadas por el usuario
npm run typecheck
```

**169 pruebas, 0 fallidas.**

---

## Lo que cambió en esta versión

### El audio ya no se encima

Era el bug que reportaste. Pasar rápido entre pantallas dejaba a `expo-speech` con frases en cola que sonaban repetidas o encimadas al volver. Tres candados lo arreglan:

1. Un contador de sesión invalida cualquier frase pedida antes de salir.
2. Antes de hablar siempre se corta lo anterior: nunca hay dos frases compitiendo.
3. Una frase idéntica dentro del mismo segundo se descarta, porque un re-render no debe sonar dos veces.

La voz se apaga al salir del reproductor con un `listener` de navegación, no solo al desmontar.

### Imágenes en todas partes

Un solo componente, `Foto`, resuelve la imagen desde `src/media/registry.ts`. Si el archivo no está, dibuja un marcador generado del id: mismo id, mismos colores siempre, con la inicial. La app se ve terminada desde el primer arranque y las fotos aparecen solas cuando las pongas, sin tocar ninguna pantalla.

Dónde hay imagen ahora: portada de ejercicio, rutina, programa, tip y mito; foto junto al nombre en toda lista de ejercicios; círculos de músculo en carruseles; fondo de bienvenida y onboarding.

Instrucciones en `assets/img/LEEME.md`.

### La insignia de evidencia salió de las listas

Antes se veía "Mito" junto al nombre de un ejercicio en la biblioteca, sin nada que lo explicara. Un veredicto necesita su razón al lado o solo genera desconfianza. Ahora la insignia vive dentro de la ficha, pegada a la nota que la sostiene. En las listas va la foto.

### Fuera los bordes gruesos

El componente `Aviso`, que ponía una barra vertical de color a la izquierda del texto, ya no existe. Lo reemplaza `Nota`: una tarjeta con fondo tenido y esquinas redondeadas. Se distingue igual, no rompe el margen y encaja con el resto.

### Diseño nuevo

Marfil cálido, tarjetas con degradado, esquinas de 22, un único acento ámbar y carbón para la acción principal. Basado en la referencia que mandaste.

### Carruseles en la principal

Rutinas, programas, ejercicios, músculos y tips. Cada uno muestra cuatro elementos y termina en una tarjeta oscura que lleva a la lista completa. Esa última tarjeta es la clave: se descubre deslizando, no leyendo un enlace pequeño.

Arriba, un botón "Explorar todo" que abre la biblioteca entera.

### Calendario

En Yo. Rejilla mensual navegable, días entrenados marcados (ámbar si fue sesión corta, carbón si pasó de 25 minutos), el día de hoy con anillo, y dos totales: días del mes y días desde que empezaste.

### Favoritos

Estrella en ejercicios, músculos, rutinas, programas y tips. Pantalla propia que agrupa por tipo, y los tipos vacíos ni aparecen.

### Bienvenida diaria

Primera pantalla del día: saludo, mensaje del día y resumen. El mensaje se elige por la fecha, no al azar, así que no cambia si cierras y vuelves a abrir. Hay banco para racha, para vuelta tras ausencia y para el primer día.

El tono es deliberadamente sobrio. Una app que grita "¡IMPARABLE!" cada mañana deja de significar algo al cuarto día.

### Animaciones

Entrada escalonada de las tarjetas, hundido al tocar, deslizamiento con dirección entre preguntas del onboarding, pantalla de "armando tu plan", corazón que pulsa, transiciones de navegación. Todo con `Animated` de React Native: cero configuración de Babel y funciona en Expo Go.

### Anuncios

Tres piezas en `src/ui/components/Anuncio.tsx`, ninguna dentro de una serie:

- **Banner** pequeño, solo en la bienvenida, lejos del botón.
- **Intersticial** a pantalla completa con cuenta atrás y botón de saltar. Máximo uno al día, y nunca la primera vez que alguien abre la app.
- **Muro de descarga**: para bajar una sección completa sin conexión, el usuario acepta ver anuncios. Se le pide una sola vez.

Son maquetas con el tamaño real. Para conectar AdMob de verdad hay instrucciones al final de ese archivo. Ojo: AdMob necesita build nativa, no corre en Expo Go.

---

## Correcciones de esta ronda

### Los nombres no se veían en la lista de ejercicios

`Toque` ponía el estilo de tamaño en la vista interior, pero el `Pressable` de fuera se quedaba con ancho de contenido. Dentro de un contenedor sin ancho, un hijo con `flex: 1` mide cero, así que el texto desaparecía. Ahora el `Pressable` hereda las propiedades de tamaño.

### Crash al tocar "Todos" en músculos

`navigate('Explorar')` desde una pantalla del stack no encuentra nada, porque Explorar vive dentro del navegador de pestañas. Corregido a navegación anidada en los 22 sitios donde ocurría.

### La voz se encimaba

Ahora hay una cola real: una frase empieza solo cuando la anterior manda su `onDone`. Y la preparación pasó de 5 a 9 segundos, porque el anuncio completo ("Sentadilla, 3 series de 12 repeticiones") no cabía antes de la cuenta atrás.

Los números del 3-2-1 usan `decirSiLibre`: si todavía se está anunciando el ejercicio, se descartan en vez de sonar encima — un "3" que llega tarde es peor que no decirlo. Siete pruebas cubren esto.

### `setLayoutAnimationEnabledExperimental` ya no hace nada

Es un no-op en la arquitectura nueva. El calendario ahora cambia de mes con `Animated`.

## Blur

Componente `Vidrio` con tres variantes: superficie, fondo de pantalla completa y pastilla. Se usa en la barra de pestañas, el banner flotante, el muro de desbloqueo, los modales y las etiquetas sobre fotos.

No está en todas partes a propósito: el desenfoque cuesta GPU y en Android de gama baja se nota. Va donde hay algo moviéndose detrás; una tarjeta sobre fondo blanco no gana nada y sí pierde fluidez.

## Anuncios, como los pediste

- **Banner** fijo abajo, solo en la pantalla principal, sobre vidrio.
- **Intersticial** a pantalla completa, máximo uno al día, en cualquier sección.
- **Desbloqueo por categoría**: al abrir la lista completa de ejercicios, rutinas, programas, músculos o contenido, aparece un muro de vidrio que deja ver lo que hay detrás. Un anuncio, una vez, y esa categoría queda abierta para siempre.
- **Nunca durante una rutina.** Ni banner, ni intersticial, ni nada.

---

## Correcciones de esta ronda

### La barra de gestos tapaba las pestañas

La barra de navegación flotaba con altura fija, así que en tu teléfono la barra de gestos de Android quedaba encima y no se podía tocar bien. Ahora la altura sale de `useSafeAreaInsets()`: la app ocupa toda la pantalla pero deja el hueco real que reporta tu teléfono. Lo mismo en cada lista, con el hook `useHuecoAbajo`.

### `Encountered two children with the same key`

En Hoy, los programas se armaban con `filter(objetivo).concat(TODOS)`, lo que repetía los del objetivo activo. Ahora se ordenan y se quitan duplicados con un `Set`. El mismo arreglo en el carrusel de músculos.

### Se podía saltar el audio tocando "siguiente"

La voz avisa cuando está ocupada (`alCambiarVoz`) y el reproductor bloquea "Empezar ya", "Ya estoy", "Cambiar" y "Omitir" mientras habla. El botón muestra "Escucha..." en lugar de quedarse muerto sin explicación.

### El muro de anuncios no bloqueaba nada

Tenía un "Ahora no" que dejaba ver el contenido igual. Ya no: la única salida sin desbloquear es volver a Hoy. El muro captura todos los toques, así que la lista de detrás se ve borrosa pero no se puede usar.

## Paleta nueva: negro y rojo

Base clara, negro real (`#0E0E10`) para la acción principal, rojo (`#D62B24`) como único acento. El degradado de héroe va de rojo a granate, como la referencia.

El rojo se usa con cuentagotas: botón de empezar, día activo del calendario, fase de trabajo del reproductor. Si todo fuera rojo, nada destacaría.

## Imagen de motivación

Cada uno de los 21 mensajes del día tiene su id (`mot_01`...`mot_21`) y su imagen en `assets/img/motivacion/`. Se muestra en la bienvenida, debajo del saludo.

## Dónde se guardan los datos

Todo en el teléfono, con AsyncStorage: perfil, historial de sesiones, series, racha, logros, favoritos, mediciones y qué secciones desbloqueaste. Nada sale del dispositivo. Sin cuentas, sin servidor, sin internet.

La contra, dicha de frente: si el usuario borra la app o cambia de teléfono, pierde el historial. El código de respaldo en Supabase está en `db/supabase_schema.sql` para cuando quieras cuentas.

---

## Cambios de esta ronda

### Fuera el audio, completo

Se eliminó `expo-speech`, el archivo `voice.ts` y todas sus llamadas. La app ya no habla. La información va en la pantalla, que se lee de un vistazo y no depende de que el teléfono tenga voz en español ni de que el volumen esté puesto.

### Azul en vez de rojo

Acento `#1D5BD6`. En el reproductor, azul para trabajar y ámbar para descansar: familias opuestas, para distinguirlos de reojo desde el suelo.

### Anuncios cada 10 minutos

Un solo controlador (`RelojAnuncios`) decide cuándo toca, así ninguna pantalla lleva su propia cuenta. Reglas:

- Uno cada 10 minutos, en cualquier pantalla.
- **Nunca mientras se entrena.** Si el temporizador vence durante una rutina, el anuncio queda pendiente y sale 4 segundos después de terminar — nadie quiere publicidad justo al soltar la última serie.
- Nada en el primer minuto de la primera sesión.
- El reloj no corre en segundo plano, para que no se acumulen.

### "Ver todas" iba siempre a ejercicios

Explorar leía el parámetro solo al montarse; si la pantalla ya existía, lo ignoraba. Ahora escucha el cambio con un `useEffect` y la navegación usa `merge: true`.

### La app se congelaba al cambiar de programa

Cada cambio serializaba el estado completo en AsyncStorage dentro del `setState`. Ahora el guardado va diferido y agrupado: la interfaz responde al instante y se escribe una sola vez aunque lleguen varios cambios seguidos. Si la app pasa a segundo plano, se vuelca lo pendiente de inmediato.

### Barra inferior sólida

Era translúcida y se veía el contenido pasar por detrás. Ahora es opaca.

### Estrella sin círculo

El favorito es solo la estrella. Sobre foto va en blanco con sombra para que se lea.

### La etiqueta "Mito" dentro de la sección de mitos

Fuera. Solo se marca lo que **no** es mito, que es la excepción y sí aporta.

### Presentación animada al primer arranque

Tres láminas con orbes que respiran de fondo, deslizamiento entre ellas, y botón de saltar desde el primer segundo. Sin anuncios: el primer minuto decide si alguien vuelve.

### Peso actual y peso objetivo

Dos pasos nuevos en el onboarding, ambos con "Prefiero no decirlo". El peso actual sirve para estimar el gasto; el objetivo es solo una referencia tuya.

**No cambia el plan.** No hay dietas, ni fechas, ni proyecciones, ni objetivos de calorías. Si prefieres no ponerlos, la app funciona igual y no muestra kcal.

---

## Rutinas propias

El usuario arma las suyas: elige ejercicios del catálogo y define series, repeticiones o segundos y descanso de cada uno. Puede reordenar, duplicar y borrar.

**Se guardan en el teléfono**, no en un servidor. Cada rutina son unos 500 bytes porque solo guarda ids del catálogo y los números elegidos — si mañana corriges un ejercicio, la rutina del usuario se actualiza sola. Funciona sin señal, que es justo cuando se abre en el gimnasio del sótano.

Cuando conectes cuentas, entran en el snapshot que ya está diseñado en `db/supabase_schema.sql`: pasa de 8.4 KB a unos 9 KB por usuario. Cero código nuevo de servidor.

### Dónde aparecen

- **Explorar → Rutinas**: bloque "Mis rutinas" arriba, con el botón de crear.
- **Hoy**: primeras en el carrusel de rutinas, con la etiqueta "Mi rutina". Si alguien se tomó el trabajo de armarlas, son lo que más probablemente quiere abrir.
- **Favoritos**: se pueden marcar como cualquier otra.

### Una decisión de diseño

**Los avisos no bloquean.** Si el usuario mete un ejercicio que carga una lesión que él mismo declaró, se lo decimos arriba de la rutina y antes de empezar — pero le dejamos hacerla.

Es distinto de las sesiones que genera la app, donde el filtro de lesiones es duro y no se relaja nunca. La diferencia: ahí elegimos nosotros, aquí elige él. Imponerle un filtro sobre su propia rutina sería tratarlo como si no supiera lo que hace.

También avisa si falta equipo que no declaró, si hay impacto con el modo silencioso puesto, y si la rutina no tiene nada de movilidad ni estiramiento.

### Robustez

Si un ejercicio desaparece del catálogo en una actualización, la rutina lo ignora y sigue funcionando en lugar de reventar. Hay una prueba para eso.

---

## Lo que sigue sin estar conectado

Te lo digo igual que la vez pasada, porque sigue siendo cierto:

- **El programa no dirige la sesión diaria.** Se ve, se puede cambiar, pero `Hoy` arma la sesión desde el objetivo, no desde la fase del programa. La semana no avanza.
- **Los retos no miden.** Empiezas uno y su progreso queda en 0.
- **6 de 20 logros se otorgan.** Los de rendimiento (primera dominada, plancha de 2 min, 5K) no los revisa nadie.
- **El RPE del resumen no se guarda.**
- **Sin respaldo ni cuentas.** Todo vive en el teléfono.
- **No la he corrido nunca.** Las 138 pruebas cubren lógica, no runtime. Espera algún error en las primeras aperturas.

## Aviso

Contenido educativo y de entrenamiento. No sustituye diagnóstico, tratamiento ni consejo médico, fisioterapéutico o nutricional individual.
