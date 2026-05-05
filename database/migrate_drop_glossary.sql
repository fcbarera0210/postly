-- Postly — eliminar tabla `glossary` (reemplazada por filtro por responsable en el tablero).
-- Ejecutar una vez en Neon / Postgres sobre bases que ya tenían el esquema antiguo.

DROP TABLE IF EXISTS glossary CASCADE;
