-- FORJA · base de datos del usuario
-- Vive en el telefono y es la fuente de verdad. El servidor solo guarda copias.
-- Separada del catalogo (forja_catalog.db) a proposito: el catalogo se
-- reemplaza entero al actualizar packs, esta nunca se toca.
--
-- Regla: aqui no se guarda nada que venga del catalogo. Solo ids.

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------- perfil
CREATE TABLE perfil (
  id                INTEGER PRIMARY KEY CHECK (id = 1),  -- fila unica
  nombre            TEXT,
  anio_nacimiento   INTEGER,
  sexo              TEXT,                 -- para estimacion de kcal, opcional
  peso_kg           REAL,                 -- opcional, solo para la formula MET
  altura_cm         REAL,
  objetivo          TEXT NOT NULL,        -- motor activo
  nivel             INTEGER DEFAULT 1,
  dias_por_semana   INTEGER DEFAULT 3,
  min_por_sesion    INTEGER DEFAULT 20,
  modo_sin_saltos   INTEGER DEFAULT 0,
  espacio           TEXT DEFAULT 'colchoneta',
  mostrar_peso      INTEGER DEFAULT 1,    -- si 0, el peso desaparece de toda la app
  mostrar_medidas   INTEGER DEFAULT 1,
  mostrar_kcal      INTEGER DEFAULT 1,
  creado_en         TEXT DEFAULT (datetime('now')),
  actualizado_en    TEXT DEFAULT (datetime('now'))
);

-- Equipo disponible. Guarda ids de 02_equipment.json del catalogo.
CREATE TABLE perfil_equipo (
  equipo_id  TEXT PRIMARY KEY,
  rango_min  REAL,   -- para mancuernas: kg minimo disponible
  rango_max  REAL
);

-- Lesiones y condiciones declaradas. Filtran ejercicios antes que nada.
CREATE TABLE perfil_contra (
  contra     TEXT PRIMARY KEY,
  declarado_en TEXT DEFAULT (datetime('now')),
  nota       TEXT
);

-- Ejercicios que el usuario no quiere volver a ver.
CREATE TABLE veto (
  ejercicio_id TEXT PRIMARY KEY,
  motivo       TEXT,          -- 'no_me_gusta' | 'molestia' | 'no_puedo'
  creado_en    TEXT DEFAULT (datetime('now'))
);

-- ------------------------------------------------------------ programa
CREATE TABLE programa_activo (
  id             INTEGER PRIMARY KEY CHECK (id = 1),
  programa_id    TEXT NOT NULL,
  semana_actual  INTEGER DEFAULT 1,
  dia_actual     INTEGER DEFAULT 1,
  iniciado_en    TEXT DEFAULT (datetime('now')),
  desplazamiento_dias INTEGER DEFAULT 0   -- cuando se usa un dia de gracia
);

-- ------------------------------------------------------------- sesiones
CREATE TABLE sesion (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid           TEXT UNIQUE NOT NULL,     -- para deduplicar al sincronizar
  fecha          TEXT NOT NULL,            -- YYYY-MM-DD, hora local
  iniciada_en    TEXT NOT NULL,
  terminada_en   TEXT,
  rutina_id      TEXT,                     -- puede ser NULL si fue libre
  programa_id    TEXT,
  semana         INTEGER,
  estado         TEXT NOT NULL DEFAULT 'en_curso',
                 -- 'en_curso' | 'completada' | 'abandonada'
  duracion_s     INTEGER,
  kcal_estimadas INTEGER,
  rpe            INTEGER CHECK (rpe BETWEEN 1 AND 10),
  motivo_abandono TEXT,                    -- de la encuesta de salida
  nota           TEXT,
  sincronizada   INTEGER DEFAULT 0
);
CREATE INDEX idx_sesion_fecha  ON sesion(fecha);
CREATE INDEX idx_sesion_sync   ON sesion(sincronizada) WHERE sincronizada = 0;

-- Una fila por serie realizada. Es la tabla que mas crece.
CREATE TABLE serie (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  sesion_id     INTEGER NOT NULL REFERENCES sesion(id) ON DELETE CASCADE,
  ejercicio_id  TEXT NOT NULL,
  orden         INTEGER NOT NULL,          -- posicion dentro de la sesion
  serie_num     INTEGER NOT NULL,
  lado          TEXT,                      -- 'izq' | 'der' | NULL
  reps          INTEGER,
  segundos      INTEGER,
  peso_kg       REAL,
  rir           INTEGER,                   -- repeticiones en reserva
  completada    INTEGER DEFAULT 1,
  omitida       INTEGER DEFAULT 0,
  descanso_real_s INTEGER
);
CREATE INDEX idx_serie_sesion ON serie(sesion_id);
CREATE INDEX idx_serie_ex     ON serie(ejercicio_id, id DESC);

-- Mejor marca por ejercicio. Se recalcula con trigger para no escanear serie.
CREATE TABLE record (
  ejercicio_id  TEXT PRIMARY KEY,
  mejor_reps    INTEGER,
  mejor_segundos INTEGER,
  mejor_peso_kg REAL,
  mejor_volumen REAL,                      -- reps * peso, para progresion
  fecha         TEXT
);

-- ---------------------------------------------------------- mediciones
CREATE TABLE medicion (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid        TEXT UNIQUE NOT NULL,
  protocolo   TEXT NOT NULL,               -- med_001 .. med_008
  fecha       TEXT NOT NULL,
  hora        TEXT,
  valor       REAL,
  unidad      TEXT,
  detalle     TEXT,                        -- JSON: {cintura:.., cadera:..}
  comparable  INTEGER DEFAULT 1,           -- 0 si se tomo fuera de protocolo
  sincronizada INTEGER DEFAULT 0
);
CREATE INDEX idx_medicion ON medicion(protocolo, fecha);

-- Las fotos NUNCA salen del telefono. Solo se guarda la ruta local.
CREATE TABLE foto (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha      TEXT NOT NULL,
  angulo     TEXT NOT NULL,                -- 'perfil_izq' | 'perfil_der' | 'frontal'
  ruta_local TEXT NOT NULL,
  protocolo  TEXT DEFAULT 'med_003'
);

-- --------------------------------------------------------------- racha
CREATE TABLE racha (
  id                 INTEGER PRIMARY KEY CHECK (id = 1),
  dias_actuales      INTEGER DEFAULT 0,
  mejor_racha        INTEGER DEFAULT 0,
  ultimo_dia         TEXT,
  gracia_usada_mes   INTEGER DEFAULT 0,
  mes_de_gracia      TEXT,                 -- YYYY-MM
  en_pausa           INTEGER DEFAULT 0
);

-- ---------------------------------------------------- retos y contenido
CREATE TABLE reto_usuario (
  reto_id     TEXT PRIMARY KEY,
  iniciado_en TEXT DEFAULT (datetime('now')),
  progreso    INTEGER DEFAULT 0,
  objetivo    INTEGER,
  completado_en TEXT
);

CREATE TABLE logro_usuario (
  logro_id   TEXT PRIMARY KEY,
  ganado_en  TEXT DEFAULT (datetime('now')),
  visto      INTEGER DEFAULT 0
);

CREATE TABLE tip_leido (
  tip_id     TEXT PRIMARY KEY,
  leido_en   TEXT DEFAULT (datetime('now')),
  guardado   INTEGER DEFAULT 0
);

-- ---------------------------------------------------------------- packs
CREATE TABLE pack_local (
  pack_id      TEXT PRIMARY KEY,
  version      TEXT NOT NULL,
  descargado_en TEXT DEFAULT (datetime('now')),
  peso_bytes   INTEGER,
  completo     INTEGER DEFAULT 0
);

-- ------------------------------------------------------------ ajustes
CREATE TABLE ajuste (clave TEXT PRIMARY KEY, valor TEXT);

-- ------------------------------------------------------------ triggers
-- Mantiene la tabla record al dia sin escanear el historial completo.
CREATE TRIGGER trg_record AFTER INSERT ON serie
WHEN NEW.completada = 1
BEGIN
  INSERT INTO record (ejercicio_id, mejor_reps, mejor_segundos, mejor_peso_kg, mejor_volumen, fecha)
  VALUES (
    NEW.ejercicio_id, NEW.reps, NEW.segundos, NEW.peso_kg,
    COALESCE(NEW.reps,0) * COALESCE(NEW.peso_kg,1), date('now'))
  ON CONFLICT(ejercicio_id) DO UPDATE SET
    mejor_reps     = MAX(COALESCE(mejor_reps,0),     COALESCE(NEW.reps,0)),
    mejor_segundos = MAX(COALESCE(mejor_segundos,0), COALESCE(NEW.segundos,0)),
    mejor_peso_kg  = MAX(COALESCE(mejor_peso_kg,0),  COALESCE(NEW.peso_kg,0)),
    mejor_volumen  = MAX(COALESCE(mejor_volumen,0),
                         COALESCE(NEW.reps,0) * COALESCE(NEW.peso_kg,1)),
    fecha          = date('now');
END;

-- Marca la sesion como no sincronizada en cuanto cambia algo dentro.
CREATE TRIGGER trg_sesion_sucia AFTER INSERT ON serie
BEGIN
  UPDATE sesion SET sincronizada = 0 WHERE id = NEW.sesion_id;
END;

-- --------------------------------------------------------------- vistas
-- Ultimo rendimiento por ejercicio, que es lo que el reproductor
-- muestra como referencia ("la vez pasada hiciste 12 con 10 kg").
CREATE VIEW v_ultima_serie AS
SELECT s.ejercicio_id, s.reps, s.segundos, s.peso_kg, ses.fecha
FROM serie s
JOIN sesion ses ON ses.id = s.sesion_id
WHERE s.completada = 1
  AND s.id = (SELECT MAX(s2.id) FROM serie s2 WHERE s2.ejercicio_id = s.ejercicio_id);

-- Volumen semanal por objetivo, para la regla del 10 por ciento.
CREATE VIEW v_volumen_semanal AS
SELECT strftime('%Y-%W', fecha) AS semana,
       COUNT(*)                 AS sesiones,
       SUM(duracion_s)/60       AS minutos,
       SUM(kcal_estimadas)      AS kcal
FROM sesion
WHERE estado = 'completada'
GROUP BY semana
ORDER BY semana DESC;

INSERT INTO racha (id) VALUES (1);
INSERT INTO ajuste (clave, valor) VALUES
  ('schema_version', '1'),
  ('solo_wifi', '1'),
  ('voz_activa', '1'),
  ('recordatorio_hora', '');
