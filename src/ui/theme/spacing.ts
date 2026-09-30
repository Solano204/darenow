
export const esp = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const MARGEN_PANTALLA = 24;

export const radio = { pastilla: 999, tarjeta: 24, chip: 8, foto: 20, nota: 8, insignia: 8 };

/**
 * La profundidad la da la superficie (`gomaAlta` + borde de 1 px), no la sombra.
 * Solo el botón primario lleva resplandor azul, y solo en iOS.
 */
export const sombra = {
  suave: { elevation: 0 },
  alta: { elevation: 0 },
  brasa: {
    shadowColor: '#2553E8', shadowOpacity: 0.25, shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 }, elevation: 0,
  },
};

export const ALTO_BOTON = 58;
export const ALTO_BARRA = 68;
export const AREA_TACTIL_MIN = 44;

/** Barra de pestanas flotante: separacion lateral y del borde inferior. */
export const SEPARACION_BARRA = 12;
export const separacionBarra = (insetAbajo: number) => Math.max(insetAbajo - 8, SEPARACION_BARRA);
