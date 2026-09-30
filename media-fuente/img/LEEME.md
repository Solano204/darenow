# Imágenes

Una imagen por ejercicio, nombrada **exactamente con el id**.

```
ejercicios/   ex_1001.jpg  ex_1002.jpg  ...   (190)
musculos/     pectoral_mayor.jpg  biceps.jpg  ...   (52)
rutinas/      rt_001.jpg ...   (30)
programas/    pg_001.jpg ...   (12)
tips/         tip_001.jpg ...  (38)
mitos/        myth_001.jpg ... (20)
motivacion/   mot_01.jpg ...   (21)
fondos/       intro_01.jpg  intro_02.jpg  intro_03.jpg
```

## La imagen del ejercicio hace tres cosas

Es un solo archivo con triple uso, y por eso no es opcional:

1. **Miniatura** en Explorar, el editor de rutina, Hoy y todas las listas.
2. **Portada** de la ficha del ejercicio.
3. **Póster del video** mientras el clip decodifica su primer fotograma.

Sin ella, el reproductor enseña un rectángulo negro cada vez que cambias de
ejercicio. No hay carpeta de thumbs: este archivo la sustituye.

El nombre lo declara el catálogo en `asset.imagen` de cada ejercicio.

## Marcado muscular

Toda foto de ejercicio lleva la musculatura trabajada resaltada: **rojo los
primarios, azul los secundarios, el resto del cuerpo en gris**. Qué músculos
son sale de los campos `primary` y `secondary`, y está escrito literal en la
especificación de medios.

## Si no quieres fotografiarlas aparte

Sácalas del propio clip. Elige el instante más reconocible del movimiento:

```bash
ffmpeg -ss 0.9 -i ex_1001.mp4 -vframes 1 -vf "scale=800:-2" -q:v 3 ex_1001.jpg
```

## Después de copiar los archivos

Desde la carpeta `app/`:

```bash
python3 generar_registry.py
```

Escanea `assets/img/`, `assets/video/` y `assets/snd/` y reescribe los tres
registros de `src/media/`. Al terminar avisa de los ejercicios a los que les
falta la imagen o el clip: es lo único que hay que mirar para saber cuánto
queda.

React Native no permite `require()` con ruta variable, así que cada archivo se
declara una vez. Por eso el script.

## Mientras tanto

Todo lo que no esté en el registro se dibuja con un marcador generado del id:
mismo id, mismos colores siempre, con la inicial del nombre. La app nunca
enseña un hueco roto.

## Formato

JPG calidad 80. 800 px de lado mayor para ejercicios y músculos; 800×420 para
portadas de rutina, programa, tip, mito y motivación; 1080×1920 para los
fondos. Entre 40 y 90 KB por archivo.

Las de músculos se recortan en círculo, así que centra el sujeto.

**Nada de texto quemado en la imagen.** Todos los títulos los pone la app
encima, y en dos tamaños distintos según la pantalla.
