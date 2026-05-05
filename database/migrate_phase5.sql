-- Postly Fase 5 — color de acento de interfaz por usuario (claves post-it o NULL = marca por defecto).
-- Ejecutar en Neon o: npm run db:migrate-phase5

ALTER TABLE users ADD COLUMN IF NOT EXISTS accent_color TEXT;
