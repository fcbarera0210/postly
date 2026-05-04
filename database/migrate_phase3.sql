-- Postly Fase 3 — display_name y auditoría mínima de solicitudes (sobre Fase 1+2 existente).
-- Ejecutar en Neon o: npm run db:migrate-phase3

ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;

ALTER TABLE board_access_requests ADD COLUMN IF NOT EXISTS resolved_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE board_access_requests ADD COLUMN IF NOT EXISTS resolved_at BIGINT;

UPDATE users SET display_name = SPLIT_PART(email, '@', 1) WHERE display_name IS NULL;
