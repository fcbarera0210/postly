-- Postly — pegar TODO este archivo en el SQL Editor de Neon (una sola ejecución).
-- Borra datos y tablas antiguas y recrea el esquema Fase 1 + 2 + 3.
-- Después tendrás que volver a registrarte / crear tableros (no hay migración de datos).

-- === Parte 1: limpiar ===
DROP TABLE IF EXISTS glossary CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS columns CASCADE;
DROP TABLE IF EXISTS board_access_requests CASCADE;
DROP TABLE IF EXISTS board_members CASCADE;
DROP TABLE IF EXISTS boards CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- === Parte 2: esquema Fase 1 + 2 + 3 ===
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  display_name TEXT
);

CREATE INDEX idx_users_email ON users(email);

CREATE TABLE boards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE TABLE board_members (
  board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor')),
  PRIMARY KEY (board_id, user_id)
);

CREATE INDEX idx_board_members_user_id ON board_members(user_id);

CREATE TABLE board_access_requests (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  requester_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  resolved_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  resolved_at BIGINT,
  UNIQUE (board_id, requester_id)
);

CREATE INDEX idx_board_access_requests_board_pending
  ON board_access_requests(board_id) WHERE status = 'pending';

CREATE TABLE columns (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  "order" INTEGER NOT NULL
);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  column_id TEXT NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  color TEXT,
  description TEXT,
  "order" INTEGER NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE TABLE task_comments (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);

CREATE TABLE task_assignees (
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, user_id)
);

CREATE INDEX idx_task_assignees_user_id ON task_assignees(user_id);

CREATE TABLE glossary (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  "order" INTEGER NOT NULL
);

CREATE INDEX idx_columns_board_id ON columns(board_id);
CREATE INDEX idx_tasks_column_id ON tasks(column_id);
CREATE INDEX idx_columns_order ON columns(board_id, "order");
CREATE INDEX idx_tasks_order ON tasks(column_id, "order");
CREATE INDEX idx_glossary_board_id ON glossary(board_id);
CREATE INDEX idx_glossary_order ON glossary(board_id, "order");
