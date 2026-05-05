# Postly

> **Postly** es una aplicación personal tipo Trello para organizar tareas de forma visual mediante post-its en un tablero. Está pensada para uso individual, con foco en simplicidad, velocidad y claridad mental.

---

## 🎯 Propósito del proyecto

- Tener un tablero visual simple para organizar tareas personales
- Reducir fricción: crear, mover y completar tareas sin complejidad
- Evitar sobre-ingeniería y dependencias innecesarias
- Servir como proyecto personal real de uso diario

Postly **no busca competir con Trello** a escala enterprise; la colaboración (editores en tableros, comentarios en tareas) está pensada para equipos pequeños y uso personal serio.

---

## 🧠 Principios del proyecto

- **Simple > Completo**
- **Visual > Textual**
- **Local-first**
- **Una sola responsabilidad**: ordenar tareas
- **UX fluida antes que features**

Si una funcionalidad no ayuda directamente a organizar tareas, no entra.

---

## 📦 Alcance funcional (producto actual)

### Cuenta y perfil
- Registro e inicio de sesión (email + contraseña), JWT en cliente
- **Nombre visible** (`display_name`) editable en perfil; si falta, se usa el email

### Tableros
- **Varios tableros** por usuario; listado separado en **Mis tableros** (dueño) y **Compartidos conmigo** (editor)
- Crear tablero con columnas iniciales por defecto
- Unirse por **ID de tablero** → solicitud pendiente al dueño
- Copiar ID del tablero (feedback accesible)

### Colaboración
- Roles **owner** y **editor** vía `board_members`
- Dueño: ver solicitudes, aceptar/rechazar (queda registro de quién resolvió y cuándo)
- Dueño: quitar editores
- Comentarios en tareas (autor, texto, fecha) y **responsables** entre miembros del tablero

### Columnas y tareas
- Columnas personalizables, mínimo 3; crear, eliminar (respetando mínimo), reordenar (drag & drop)
- Tareas tipo post-it: título, color opcional, mover dentro de la columna y entre columnas

### Fuera de alcance (por ahora)
- Notificaciones push, email o in-app
- Descripciones largas en tarea, fechas de vencimiento, prioridades numéricas, checklists complejos

---

## 🎨 UI / UX

### Enfoque
- **Desktop-first**
- Responsive para uso en móvil
- Interacciones rápidas

### Estilo
- Inspiración post-it
- Colores suaves pero diferenciables
- Animaciones discretas en drag & drop

### Modo oscuro
- Incluido desde el inicio
- Se ajusta automáticamente a la configuración del sistema
- Usa `prefers-color-scheme`

---

## 🔐 Seguridad

- Contraseñas con hash (no en texto plano)
- **JWT** firmado con `NUXT_SESSION_SECRET`; rutas API leen credenciales solo en servidor
- **`DATABASE_URL`** y secreto no expuestos en `runtimeConfig.public`
- Cliente **sin** SDK de Neon: todo acceso a datos vía **Nitro** `/api/*`

---

## 🗄️ Persistencia de datos

- **Neon (Postgres serverless)** como única base de datos
- Esquema canónico: `database/schema.sql` (ver también migraciones `migrate_phase2.sql`, `migrate_phase3.sql`)
- API Nitro en `server/` ejecuta SQL con `@neondatabase/serverless`

---

## 🧱 Modelo de datos (resumen)

La fuente de verdad son las tablas en `database/schema.sql`, entre ellas: `users` (incl. `display_name`), `boards`, `board_members`, `board_access_requests` (incl. `resolved_by_user_id`, `resolved_at`), `columns`, `tasks`, `task_comments`, `task_assignees`.

---

## ⚙️ Stack tecnológico

### Frontend
- **Nuxt 4**
- **Vue 3 (Composition API)**
- **CSS puro** (sin frameworks)
- **vuedraggable** para drag & drop en columnas

### Backend / API
- **Nitro** (rutas en `server/api/`), JWT, validación de membresía en tablero

### Infraestructura
- **Vercel** (deploy recomendado)
- **Neon** (Postgres serverless)

---

## 📁 Estructura del proyecto (orientativa)

```txt
postly/
├─ pages/
│  ├─ index.vue           # Login / redirección
│  └─ boards/
│     ├─ index.vue        # Listado, perfil, crear / unirse
│     └─ [id].vue         # Kanban
├─ server/api/            # REST + Neon
├─ components/
│  ├─ Board.vue, Column.vue, TaskCard.vue, AssigneeFilter.vue, LoginGate.vue, …
├─ composables/           # useAuth, useBoard, useTasks, useTaskDetail, …
├─ database/              # schema.sql y migraciones
└─ utils/
```

---

## 🧩 Componentes clave

### Board.vue
- Vista Kanban del tablero; modales de miembros, solicitudes (pendientes + historial reciente), detalle de tarea

### Column.vue / TaskCard.vue
- Columnas y tarjetas; arrastre de tareas

### LoginGate.vue
- Registro e inicio de sesión

---

## 🧠 Decisiones conscientes

- **API en servidor**: evita exponer credenciales de BD en el cliente
- **Sin framework CSS**: control del diseño con variables en `assets/styles`
- **Roadmap por fases**: ver `POSTLY_ROADMAP.md`

---

## 🚫 Fuera de alcance explícito (hoy)

- Notificaciones in-app o por email
- Fechas de vencimiento y recordatorios en tareas
- Analytics de producto

---

## 📌 Identidad

**Nombre:** Postly  
**Tagline:** _Tareas simples, mente clara_

Postly es una herramienta personal. Si crece, será por necesidad real, no por ambición.

