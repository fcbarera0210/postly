-- Postly — limpiar Neon y dejar listo para schema.sql
-- Ejecuta este script completo en el SQL Editor de Neon, luego ejecuta database/schema.sql.
-- ADVERTENCIA: borra todos los datos de las tablas listadas.

DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS columns CASCADE;
DROP TABLE IF EXISTS board_access_requests CASCADE;
DROP TABLE IF EXISTS board_members CASCADE;
DROP TABLE IF EXISTS boards CASCADE;
DROP TABLE IF EXISTS users CASCADE;
