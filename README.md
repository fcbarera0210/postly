# Postly

> **Tareas simples, mente clara**

Postly es una aplicación personal tipo Trello para organizar tareas de forma visual mediante post-its en un tablero. Está diseñada para uso individual, con foco en simplicidad, velocidad y claridad mental.

![Postly](https://img.shields.io/badge/Nuxt-4.2.2-00DC82?style=flat&logo=nuxt.js)
![Vue](https://img.shields.io/badge/Vue-3.5.26-4FC08D?style=flat&logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)

## ✨ Características

- 📋 **Tablero visual** - Organiza tus tareas en columnas personalizables
- 🎨 **Post-its con colores** - Diferencia tareas con colores opcionales
- 🔍 **Filtro por responsable** - Ver solo tareas de un responsable; la lista incluye a quienes tengan al menos una tarea; el filtro se puede compartir vía `?assignee=` en la URL
- 🔄 **Drag & Drop** - Mueve tareas entre columnas o reordénalas fácilmente
- 👤 **Autenticación por email/password** - Sistema de usuarios con registro e inicio de sesión
- 💾 **Sesión persistente** - Tu sesión se mantiene al recargar la página
- 📧 **Recordar email** - Opción para guardar tu email en el login
- 🔒 **Varios tableros y colaboración** - Tableros propios y compartidos como editor; solicitudes de acceso por ID de tablero
- 🚪 **Cerrar sesión** - Botón de logout para cambiar de cuenta
- 🌙 **Modo oscuro** - Se adapta automáticamente a tu sistema
- 📱 **Responsive** - Funciona perfectamente en desktop y móvil
- ⚡ **Rápido y ligero** - Sin dependencias pesadas, solo lo esencial
- 🎨 **Diseño moderno** - Interfaz limpia con mejoras UX/UI
- 👨‍💻 **Footer informativo** - Footer con créditos de desarrollo

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Una cuenta en [Neon](https://neon.tech) (Postgres serverless)

### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/fcbarera0210/postly.git
cd postly
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crear archivo `.env` en la raíz (puedes copiar `.env.example`):

```env
DATABASE_URL="tu_url_de_conexion_de_neon"
NUXT_SESSION_SECRET="un_secreto_largo_para_jwt"
```

Si en local las rutas `/api/*` fallan pero `npm run db:migrate-legacy` sí toca tu Neon, añade la misma URL como **`NUXT_DATABASE_URL`** (Nitro resuelve antes `process.env`).

En **Vercel**, añade `DATABASE_URL`, `NUXT_SESSION_SECRET` y, si hiciera falta, `NUXT_DATABASE_URL` igual que `DATABASE_URL`.

4. **Configurar la base de datos**

En Neon (SQL Editor), si partes de cero:

1. **Instalación limpia:** ejecuta `database/reset_neon.sql` y luego `database/schema.sql` (o `npm run db:apply`, que deja el esquema completo según `schema.sql`).
2. **Ya tenías datos / tablas viejas** (p. ej. `boards` sin `created_at` o sin `board_members`): ejecuta `npm run db:migrate-legacy`, que aplica `database/migrate_legacy_to_phase1.sql`.
3. **Solo falta Fase 2** (comentarios y responsables en tareas): si ya tienes el esquema Fase 1 en Neon, ejecuta `npm run db:migrate-phase2` o pega `database/migrate_phase2.sql` en el SQL Editor.
4. **Solo falta Fase 3** (`users.display_name`, auditoría de solicitudes): ejecuta `npm run db:migrate-phase3` o pega `database/migrate_phase3.sql`.

**Despliegue (Vercel + Neon):** en el proyecto de Vercel, define `DATABASE_URL` (URL de conexión de la rama de Neon que uses en producción), `NUXT_SESSION_SECRET` (cadena larga y secreta) y, si Nitro no resuelve la URL en build, `NUXT_DATABASE_URL` con el mismo valor que `DATABASE_URL`. Tras un despliegue que cambie el esquema, ejecuta en Neon las migraciones pendientes (`migrate_phase2.sql` / `migrate_phase3.sql`) o `npm run db:apply` solo en bases nuevas (borra datos).

Detalle del roadmap por fases: `POSTLY_ROADMAP.md`.

5. **Ejecutar en desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📦 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia el servidor de desarrollo

# Base de datos (Neon; usar URL directa sin pooler recomendado para DDL)
npm run db:apply             # reset_neon + schema.sql (borra datos)
npm run db:migrate-legacy    # Fase 1 sobre BD antigua
npm run db:migrate-phase2    # tablas de comentarios / responsables
npm run db:migrate-phase3    # display_name + columnas de resolución de solicitudes

# Producción
npm run build        # Construye la aplicación para producción
npm run preview      # Previsualiza el build de producción
npm run generate     # Genera una versión estática
```

## 🏗️ Stack Tecnológico

### Frontend
- **Nuxt 3** - Framework Vue.js con SSR
- **Vue 3** - Composition API
- **TypeScript** - Tipado estático
- **vuedraggable** - Drag & drop entre columnas
- **Heroicons** - Librería de iconos SVG gratuita
- **CSS puro** - Sin frameworks CSS, control total del diseño

### Backend/Base de Datos
- **Neon** - Postgres serverless
- **@neondatabase/serverless** - Cliente Neon en rutas Nitro (`server/`)
- **API REST** - Autenticación JWT y CRUD bajo `/api/*`

### Infraestructura
- **Vercel** - Deploy y hosting (recomendado)

## 📁 Estructura del Proyecto

```
postly/
├── components/          # Componentes Vue
│   ├── Board.vue       # Contenedor principal del tablero
│   ├── Column.vue      # Columna de tareas
│   ├── TaskCard.vue    # Tarjeta de tarea (post-it)
│   ├── AssigneeFilter.vue # Filtro por responsable en el tablero
│   ├── LoginGate.vue   # Pantalla de autenticación (login/registro)
│   └── Footer.vue      # Footer con información de desarrollo
├── composables/        # Composables de Vue (lógica reutilizable)
│   ├── useBoard.ts     # Gestión del tablero
│   ├── useColumns.ts   # Gestión de columnas
│   ├── useTasks.ts     # Gestión de tareas
│   ├── useTaskDetail.ts # Detalle, comentarios y responsables (Fase 2)
│   ├── useAuth.ts      # Autenticación (JWT vía API)
│   └── useApi.ts       # $fetch con Authorization
├── database/           # Scripts SQL
│   ├── schema.sql      # Esquema actual (fuente de verdad)
│   ├── migrate_phase2.sql / migrate_phase3.sql / migrate_drop_glossary.sql  # Migraciones incrementales
│   └── reset_neon.sql  # Limpia tablas (antes de schema)
├── server/             # Nitro: API y Neon
│   ├── api/
│   └── utils/
├── middleware/
│   └── auth.ts         # Protege /boards/*
├── utils/
│   ├── types.ts        # Tipos compartidos (importar desde aquí)
│   └── security.ts
├── assets/             # Recursos estáticos
│   └── styles/         # Estilos CSS
│       ├── base.css    # Estilos base
│       └── variables.css # Variables CSS (incluye colores de marca)
├── public/             # Archivos públicos
│   ├── logo-svg/       # Logos en formato SVG
│   │   └── Logo-Postly.svg
│   └── logo-png/       # Logos en formato PNG
│       └── Logo-Postly.png
├── pages/              # Páginas de Nuxt
│   ├── index.vue       # Login / redirección a tableros
│   └── boards/
│       ├── index.vue   # Listado, crear, unirse por ID
│       └── [id].vue    # Kanban del tablero
└── app.vue             # Componente raíz
```

## 🎯 Funcionalidades

### Tablero
- ✅ Tablero único por usuario (cada usuario tiene su propio tablero)
- ✅ Nombre editable del tablero (doble clic en desktop, long press en móvil)
- ✅ Persistencia entre dispositivos
- ✅ Aislamiento completo de datos entre usuarios
- ✅ Iconos modernos para acciones (agregar columna, cerrar sesión)

### Columnas
- ✅ Mínimo 3 columnas obligatorias
- ✅ Crear nuevas columnas
- ✅ Eliminar columnas (respetando mínimo)
- ✅ Editar nombre de columnas (doble clic en desktop, long press en móvil)
- ✅ Reordenar columnas (drag & drop)

### Tareas
- ✅ Crear tareas con título
- ✅ Asignar color opcional a tareas
- ✅ Editar tareas (doble clic en desktop, long press en móvil)
- ✅ Eliminar tareas
- ✅ Mover tareas entre columnas (drag & drop)
- ✅ Reordenar tareas dentro de columnas

### Filtro por responsable
- ✅ Lista horizontal con icono «todos» y círculos con iniciales por responsable (quienes tienen al menos una tarea)
- ✅ Al elegir una persona, solo se muestran las tareas donde figura como responsable
- ✅ Parámetro de URL `assignee` para enlazar o guardar el filtro (`router.replace`, sin llenar el historial)

### Mejoras UX/UI
- ✅ Scroll de página completa (no en columnas individuales)
- ✅ Columnas que crecen dinámicamente con el contenido
- ✅ Botones de eliminar simplificados (solo X sin círculo)
- ✅ Mejoras visuales: sombras, transiciones, espaciado
- ✅ Mejor jerarquía tipográfica y contraste
- ✅ Estados hover y feedback visual mejorados

## 🔐 Autenticación y Seguridad

Postly utiliza un sistema de autenticación por email y contraseña:

- **Registro de usuarios**: Crea tu cuenta con email y contraseña
- **Inicio de sesión**: Accede con tus credenciales
- **Contraseñas seguras**: Hash con salt usando SHA-256
- **Sesiones**: Válidas por 24 horas y persistentes (se mantienen al recargar la página)
- **Recordar email**: Opción opcional para guardar el email en el navegador
- **Aislamiento de datos**: Cada usuario tiene su propio tablero completamente aislado
- **Cerrar sesión**: Botón de logout para cambiar de cuenta
- **Validación**: Email y contraseña con validación de formato

---

Hecho con ❤️ usando Nuxt 3 y Vue 3
