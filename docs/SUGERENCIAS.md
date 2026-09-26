# Sugerencias (no implementadas)

Ideas que salieron al rediseñar la sesión de entrenamiento y que **no** se hicieron porque cambian funcionalidad. Cada una espera la decisión del dueño.

- **Aviso cuando termina una fase con la app en segundo plano.** Hoy no hay notificaciones: si el teléfono se bloquea a mitad de un descanso, solo el sonido de la sesión avisa (y el sistema puede cortarlo). Una notificación local programada al inicio de cada fase evitaría depender de que la pantalla siga encendida.
- **Modo horizontal para el reproductor.** La app es solo vertical (`orientation: portrait`). Con el teléfono apoyado en el suelo, un layout con el anillo a la izquierda y el modelo a la derecha se leería mejor. Requiere habilitar la orientación en `app.json` y probar cada pantalla.
- **Mostrar el siguiente ejercicio durante el descanso.** Hoy el descanso solo dice el nombre del que viene. Si se quiere, el modelo del siguiente ejercicio podría verse a media opacidad como vista previa.
- **Guardar los ajustes del editor.** Series, tiempo y descanso que el usuario cambia no se recuerdan para la próxima vez que haga ese ejercicio.
- **Recortes PNG de los modelos.** Con un PNG transparente por ejercicio, el modelo iría directamente sobre el fondo, más grande, en lugar de sobre la ficha `magnesia`.
