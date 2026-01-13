-- Postly Migration: Sistema de Usuarios
-- Ejecutar este script en Neon para migrar a autenticación por email/password
-- IMPORTANTE: Ejecutar este script manualmente en Neon SQL Editor

-- ============================================
-- PASO 1: Crear tabla de usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

-- Índice para búsquedas por email (ya es UNIQUE, pero el índice ayuda en performance)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- PASO 2: Migrar datos existentes (OPCIONAL)
-- ============================================
-- Si tienes datos existentes en boards, primero necesitas crear usuarios para ellos
-- Descomenta y ajusta según tus necesidades:

-- Opción A: Si NO tienes datos importantes, puedes saltar este paso
-- y simplemente continuar con el PASO 3

-- Opción B: Si tienes datos que quieres preservar, crea un usuario "migrado":
-- INSERT INTO users (id, email, password_hash, created_at)
-- VALUES ('migrated_user_1', 'migrated@postly.local', 'dummy_hash', EXTRACT(EPOCH FROM NOW())::BIGINT * 1000);

-- Luego asigna ese usuario a los boards existentes:
-- UPDATE boards SET user_id = 'migrated_user_1' WHERE user_id IS NULL;

-- ============================================
-- PASO 3: Modificar tabla boards
-- ============================================
-- IMPORTANTE: Si tienes datos existentes, asegúrate de haber ejecutado el PASO 2 primero

-- Agregar columna user_id (temporalmente nullable para permitir la migración)
ALTER TABLE boards ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Si ya tienes datos, asigna un user_id a los boards existentes
-- (ajusta el user_id según lo que hayas creado en el PASO 2)
-- UPDATE boards SET user_id = 'migrated_user_1' WHERE user_id IS NULL;

-- Ahora hacer user_id NOT NULL (solo después de haber asignado valores)
-- ALTER TABLE boards ALTER COLUMN user_id SET NOT NULL;

-- Agregar foreign key constraint
ALTER TABLE boards ADD CONSTRAINT fk_boards_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Crear índice para mejorar performance de queries por usuario
CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards(user_id);

-- Eliminar columna pin_hash (ya no se necesita)
ALTER TABLE boards DROP COLUMN IF EXISTS pin_hash;

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecuta estas queries para verificar que todo está correcto:

-- Verificar que la tabla users existe
-- SELECT * FROM users LIMIT 1;

-- Verificar que boards tiene user_id
-- SELECT id, name, user_id FROM boards LIMIT 5;

-- Verificar que no hay boards sin user_id
-- SELECT COUNT(*) FROM boards WHERE user_id IS NULL;
