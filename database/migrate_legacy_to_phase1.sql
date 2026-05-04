-- Postly: actualizar BD antigua (boards sin created_at, sin board_members, etc.) al esquema Fase 1.
-- Ejecutar en Neon si ya tenías tablas viejas y NO quieres borrar todo con reset_neon.sql.
-- Seguro de ejecutar varias veces (idempotente en lo posible).

-- boards: columna que el código nuevo exige
ALTER TABLE boards ADD COLUMN IF NOT EXISTS created_at BIGINT;
UPDATE boards SET created_at = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT WHERE created_at IS NULL;

-- Miembros y solicitudes (si faltan)
CREATE TABLE IF NOT EXISTS board_members (
  board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor')),
  PRIMARY KEY (board_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_board_members_user_id ON board_members(user_id);

CREATE TABLE IF NOT EXISTS board_access_requests (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  requester_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  UNIQUE (board_id, requester_id)
);

CREATE INDEX IF NOT EXISTS idx_board_access_requests_board_pending
  ON board_access_requests(board_id) WHERE status = 'pending';

-- Backfill boards.user_id → board_members: lo ejecuta scripts/migrate-legacy.mjs si la columna existe.

-- Quitar columnas obsoletas de boards
ALTER TABLE boards DROP COLUMN IF EXISTS user_id;
ALTER TABLE boards DROP COLUMN IF EXISTS pin_hash;
