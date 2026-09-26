# Imágenes por generar

Mientras estas imágenes no existan, la app usa las fotos actuales tratadas con Skia (`FotoTratada`: −35 % de saturación, exposición 0.72, sombras hacia azul frío, degradado a `goma`). Con las nuevas el diseño sube de nivel; no hace falta tocar código salvo un flag.

## Dónde guardarlas

Se conserva la convención del proyecto: mismo nombre, misma carpeta, se reemplaza el archivo. Así no cambia ningún `require`.

1. Copiar los archivos a `assets/img/…` con los nombres de la tabla.
2. Si se añaden recortes (`*_recorte.png`), correr desde `app/`: `python generar_registry.py`. `Presentacion` los detecta solos (`fuente('fondo', '<id>_recorte')`); sin recorte usa solo foto, título y cuerpo.
3. Poner `TRATAR_FOTOS = false` en `src/components/fx/FotoTratada.tsx`: las fotos nuevas ya vienen oscuras y no deben pasar otra vez por el tratamiento.

Formato: JPG (o WebP) optimizado, máximo 1080 px de ancho, menos de 250 KB cada una. Recortes en PNG con transparencia, mismo lienzo y misma alineación que su foto.

## Receta común (mismo modelo en todas, por consistencia)

Gym oscuro, piso de goma negro con motas de color, una sola luz dura lateral que recorta al atleta, fondo que cae a negro. Polvo de magnesia suspendido en el haz de luz. Ropa en grises oscuros o negro. Encuadre vertical 9:16, sujeto en el tercio superior-central y la parte baja oscura para que el texto se lea encima. Foto editorial deportiva.

## Lista

| Archivo | Uso | Tamaño | Prompt |
|---|---|---|---|
| `assets/img/fondos/intro_04.jpg` | Presentación, paso 1 «Gratis. Todo. Sin trucos» | 1080×1920 | Hombre atlético latino, camiseta sin mangas gris oscuro, sosteniendo mancuernas con determinación, gym oscuro con piso de goma negro con motas de colores, una luz dura lateral, polvo de magnesia en el aire, fondo que se desvanece a negro, foto editorial deportiva, vertical 9:16 |
| `assets/img/fondos/intro_01.jpg` | Paso 2 «Entrena lo que tú quieras trabajar» | 1080×1920 | El mismo hombre, con liga de resistencia o cuerda, misma iluminación y fondo |
| `assets/img/fondos/intro_02.jpg` | Paso 3 «La sesión cabe en tu tiempo» | 1080×1920 | El mismo hombre, mirando su reloj, sensación de «tengo poco tiempo» |
| `assets/img/fondos/intro_03.jpg` | Paso 4 «Te decimos lo que sí funciona…» | 1080×1920 | El mismo hombre, leyendo una tableta con gesto escéptico |
| `assets/img/fondos/bienvenida.jpg` | Bienvenida, mitad superior a sangre | 1080×1300 | Mano abierta levantada cubierta de magnesia, polvo cayendo, fondo negro, luz dura |
| `assets/img/fondos/plan-listo.jpg` | Plan listo, mitad superior (38 % del alto) | 1080×1920 | Primer plano de manos con magnesia sujetando una barra olímpica, polvo en el aire, fondo negro, vertical 9:16, parte baja oscura |
| `assets/img/motivacion/mot_18.jpg` | Tarjeta «Bien vuelto» | 1080×600 | Tenis y tapete junto a una puerta, luz de mañana, en tonos oscuros y cálidos, sin blancos quemados |

Sin `plan-listo.jpg` la pantalla del plan usa la foto de la bienvenida tratada. Tras copiarla, correr `python generar_registry.py`. La imagen opcional de «Tu cuenta» (casillero con candado) no se usa: el diseño funciona sin ella.

Recortes opcionales (PNG sin fondo del atleta, mismo lienzo que su foto): `intro_04_recorte.png`, `intro_01_recorte.png`, `intro_02_recorte.png`, `intro_03_recorte.png`, todos en `assets/img/fondos/`.

## Pestaña Hoy (Parte 3)

Todo lo de esta sección es opcional: sin estos archivos Hoy usa las fotos actuales con el tratamiento de `FotoOscura` (exposición 0.8 sobre `gomaAlta` y velo a goma).

| Archivo | Uso | Formato | Prompt |
|---|---|---|---|
| `assets/img/ejercicios/ex_XXXX_recorte.png` | «Elige tu enfoque»: el atleta rompe el marco 24 px por arriba | PNG con transparencia, 600×720, cuerpo completo, pies en el borde inferior, sin sombra proyectada | El mismo modelo de la receta común ejecutando el ejercicio `ex_XXXX`, fondo transparente, luz dura lateral |
| `assets/img/musculos/<id>_hoy.jpg` | «Músculos de hoy»: versión con el músculo resaltado, cuando la sesión lo trabaja | JPG 800×430, mismo encuadre que `<id>.jpg` | La foto anatómica del músculo, en gris oscuro, con el músculo en `magnesia` brillante y el resto apagado |
| `assets/img/rutinas/rt_001.jpg` … `rt_030.jpg`, `assets/img/programas/pg_001.jpg` … | Tarjetas de rutina (240×150) y de programa (200×250, pila) | JPG oscuro, sujeto en el tercio superior; la parte baja debe quedar libre para el nombre | Receta común, un ejercicio por rutina |

Cualquier `ex_XXXX` puede tener recorte; los que no lo tengan usan la foto dentro de la tarjeta. Tras copiarlos, `python generar_registry.py` los registra solos (escanea cada carpeta por nombre de archivo, con o sin sufijo). `TarjetaEnfoque` busca `ex_XXXX_recorte` y `FichaMusculo` busca `<id>_hoy`; ningún código cambia.

Las demás tarjetas de mensaje (`mot_01` a `mot_21`) siguen siendo las actuales. `mot_18` a `mot_20` son las que salen al volver tras días sin entrenar; conviene renovarlas con la misma receta cuando se pueda.
