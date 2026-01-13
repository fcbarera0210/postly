-- Postly Database Schema
-- Ejecutar este script en Neon para crear las tablas necesarias

-- Tabla de boards (tableros)
CREATE TABLE IF NOT EXISTS boards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pin_hash TEXT NOT NULL
);

-- Tabla de columns (columnas)
CREATE TABLE IF NOT EXISTS columns (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  "order" INTEGER NOT NULL
);

-- Tabla de tasks (tareas/post-its)
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  column_id TEXT NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  color TEXT,
  "order" INTEGER NOT NULL,
  created_at BIGINT NOT NULL
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_columns_board_id ON columns(board_id);
CREATE INDEX IF NOT EXISTS idx_tasks_column_id ON tasks(column_id);
CREATE INDEX IF NOT EXISTS idx_columns_order ON columns(board_id, "order");
CREATE INDEX IF NOT EXISTS idx_tasks_order ON tasks(column_id, "order");
