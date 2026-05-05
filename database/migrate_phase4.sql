-- Postly Fase 4 — descripción Markdown opcional en tareas.
-- Ejecutar en Neon o: npm run db:migrate-phase4

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;
