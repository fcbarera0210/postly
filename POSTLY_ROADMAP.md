# Postly — Roadmap y checklist

Plan maestro para evolucionar Postly (varios tableros, colaboración, tareas con comentarios y responsables). **No incluye notificaciones** (email/in-app).

Marca las casillas a medida que avances: `- [ ]` → `- [x]`.

---

## Fase 1 — Fundación y colaboración en tablero

- [x] Base de datos nueva en Neon (`database/schema.sql` + opcional `database/reset_neon.sql`); datos previos eliminados si aplica
- [x] `DATABASE_URL` y `NUXT_SESSION_SECRET` solo en servidor (Vercel / `.env` local); sin exposición en `runtimeConfig.public`
- [x] Cliente sin `@neondatabase/serverless`; todas las mutaciones y lecturas vía `/api/*`
- [x] Autenticación: login/registro devuelven JWT; cliente guarda token y envía `Authorization: Bearer`
- [x] Tablas: `users`, `boards`, `board_members` (owner/editor), `board_access_requests`, `columns`, `tasks`
- [x] Varios tableros por usuario; propiedad vía `board_members.role = owner`
- [x] Rutas UI: listado `/boards`, vista Kanban `/boards/[id]`
- [x] Crear tablero; al registro, tablero inicial + columnas por defecto vía API
- [x] Unirse a tablero: usuario introduce ID → solicitud `pending`
- [x] Dueño: ver solicitudes pendientes, aceptar (añade editor) / rechazar
- [x] Dueño: quitar miembros (editores); no eliminar al único dueño sin definir transferencia (MVP)
- [x] Copiar / mostrar ID del tablero (básico en Fase 1; pulido en Fase 3)

---

## Fase 2 — Tareas colaborativas

- [x] Tabla `task_comments` (tarea, autor, texto, `created_at`)
- [x] Tabla `task_assignees` (o equivalente) — solo usuarios miembros del tablero
- [x] API y UI: panel o modal de detalle de tarea con comentarios (lista + crear)
- [x] API y UI: asignar / quitar responsables en la tarea
- [x] Actualizar tipos y documentación del esquema

---

## Fase 3 — Perfil y pulido

- [x] Campo `display_name` (u homólogo) en `users`; UI de perfil
- [x] Separación clara en listado: “Mis tableros” vs “Compartidos conmigo” (si aplica por rol)
- [x] Pulido: copiar ID, accesibilidad, vacíos, errores
- [x] `database/schema.sql` como fuente de verdad; README / `postly_project_bible.md` alineados
- [x] Índices y notas de despliegue (variables, Neon, Vercel)
- [x] (Opcional) Auditoría mínima: quién aprobó solicitudes / cambios relevantes

---

## Excluido (por ahora)

- Notificaciones push, email o in-app

---

## Referencias

- Plan de ejecución detallado de Fase 1: ver historial del plan en Cursor (Postly roadmap y fase 1).
- Variables Vercel: `DATABASE_URL`, `NUXT_SESSION_SECRET`.
