# Postly

> **Tareas simples, mente clara**

Postly es una aplicación personal tipo Trello para organizar tareas de forma visual mediante post-its en un tablero. Está diseñada para uso individual, con foco en simplicidad, velocidad y claridad mental.

![Postly](https://img.shields.io/badge/Nuxt-4.2.2-00DC82?style=flat&logo=nuxt.js)
![Vue](https://img.shields.io/badge/Vue-3.5.26-4FC08D?style=flat&logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)

## ✨ Características

- 📋 **Tablero visual** - Organiza tus tareas en columnas personalizables
- 🎨 **Post-its con colores** - Diferencia tareas con colores opcionales
- 📚 **Glosario de colores** - Crea un glosario personalizado asociando nombres a colores
- 🔄 **Drag & Drop** - Mueve tareas entre columnas o reordénalas fácilmente
- 👤 **Autenticación por email/password** - Sistema de usuarios con registro e inicio de sesión
- 🔒 **Tableros privados** - Cada usuario tiene su propio tablero aislado
- 🚪 **Cerrar sesión** - Botón de logout para cambiar de cuenta
- 🌙 **Modo oscuro** - Se adapta automáticamente a tu sistema
- 📱 **Responsive** - Funciona perfectamente en desktop y móvil
- ⚡ **Rápido y ligero** - Sin dependencias pesadas, solo lo esencial
- 🎨 **Diseño moderno** - Interfaz limpia con mejoras UX/UI

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

Crear archivo `.env` en la raíz del proyecto:
```env
DATABASE_URL="tu_url_de_conexion_de_neon"
```

4. **Configurar la base de datos**

Ejecutar los scripts SQL en tu base de datos Neon:
- Abre el SQL Editor en Neon
- Primero ejecuta el contenido de `database/schema.sql` (esquema base)
- Luego ejecuta el contenido de `database/migration_users.sql` (sistema de usuarios)

5. **Ejecutar en desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📦 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia el servidor de desarrollo

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
- **CSS puro** - Sin frameworks CSS, control total del diseño

### Backend/Base de Datos
- **Neon** - Postgres serverless
- **@neondatabase/serverless** - Cliente para Neon

### Infraestructura
- **Vercel** - Deploy y hosting (recomendado)

## 📁 Estructura del Proyecto

```
postly/
├── components/          # Componentes Vue
│   ├── Board.vue       # Contenedor principal del tablero
│   ├── Column.vue      # Columna de tareas
│   ├── TaskCard.vue    # Tarjeta de tarea (post-it)
│   ├── Glossary.vue    # Glosario de colores
│   └── LoginGate.vue   # Pantalla de autenticación (login/registro)
├── composables/        # Composables de Vue (lógica reutilizable)
│   ├── useBoard.ts     # Gestión del tablero
│   ├── useColumns.ts   # Gestión de columnas
│   ├── useTasks.ts     # Gestión de tareas
│   ├── useGlossary.ts  # Gestión del glosario de colores
│   └── useAuth.ts      # Autenticación con email/password
├── database/           # Scripts SQL
│   ├── schema.sql      # Esquema base de la base de datos
│   └── migration_users.sql # Migración para sistema de usuarios
├── utils/              # Utilidades
│   ├── db.ts           # Conexión y queries a Neon
│   └── security.ts     # Hash y verificación de contraseñas
├── assets/             # Recursos estáticos
│   └── styles/         # Estilos CSS
│       ├── base.css    # Estilos base
│       └── variables.css # Variables CSS
├── pages/              # Páginas de Nuxt
│   └── index.vue       # Página principal
└── app.vue             # Componente raíz
```

## 🎯 Funcionalidades

### Tablero
- ✅ Tablero único por usuario (cada usuario tiene su propio tablero)
- ✅ Nombre editable del tablero (doble clic)
- ✅ Persistencia entre dispositivos
- ✅ Aislamiento completo de datos entre usuarios

### Columnas
- ✅ Mínimo 3 columnas obligatorias
- ✅ Crear nuevas columnas
- ✅ Eliminar columnas (respetando mínimo)
- ✅ Editar nombre de columnas (doble clic)
- ✅ Reordenar columnas (drag & drop)

### Tareas
- ✅ Crear tareas con título
- ✅ Asignar color opcional a tareas
- ✅ Editar tareas (doble clic)
- ✅ Eliminar tareas
- ✅ Mover tareas entre columnas (drag & drop)
- ✅ Reordenar tareas dentro de columnas

### Glosario de Colores
- ✅ Crear elementos del glosario asociando nombres a colores
- ✅ Editar nombres de elementos (doble clic)
- ✅ Eliminar elementos del glosario
- ✅ Visualización como badges con círculo de color y nombre
- ✅ Persistencia en base de datos

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
- **Sesiones**: Válidas por 24 horas
- **Aislamiento de datos**: Cada usuario tiene su propio tablero completamente aislado
- **Cerrar sesión**: Botón de logout para cambiar de cuenta
- **Validación**: Email y contraseña con validación de formato

## 🚀 Deploy

### Vercel (Recomendado)

1. Conectar el repositorio a Vercel
2. Configurar la variable de entorno `DATABASE_URL` en Vercel
3. El deploy se realizará automáticamente en cada push

### Otros proveedores

La aplicación es compatible con cualquier proveedor que soporte Nuxt 3:
- Netlify
- Cloudflare Pages
- Railway
- Render

## 🧪 Desarrollo

### Estructura de datos

```typescript
// User
interface User {
  id: string
  email: string
  password_hash: string
  created_at: number
}

// Board
interface Board {
  id: string
  name: string
  user_id: string  // Relación con usuario
}

// Column
interface Column {
  id: string
  board_id: string
  title: string
  order: number
}

// Task
interface Task {
  id: string
  column_id: string
  title: string
  color: string | null
  order: number
  created_at: number
}

// GlossaryItem
interface GlossaryItem {
  id: string
  board_id: string
  name: string
  color: string
  order: number
}
```

## 🎨 Mejoras Recientes

### Versión Actual - Sistema de Usuarios

**Nueva Funcionalidad - Autenticación por Email/Password:**
- ✅ Sistema completo de registro e inicio de sesión
- ✅ Autenticación segura con hash de contraseñas (SHA-256 con salt)
- ✅ Cada usuario tiene su propio tablero completamente aislado
- ✅ Sesiones válidas por 24 horas
- ✅ Botón de logout para cerrar sesión
- ✅ Validación de email y contraseña
- ✅ Interfaz moderna con toggle entre login/registro
- ✅ Creación automática de tablero inicial con columnas por defecto al registrarse

**Mejoras UX/UI:**
- Sistema de scroll mejorado: las columnas crecen dinámicamente y el scroll es de la página completa, evitando conflictos con drag & drop
- Botones de eliminar simplificados: diseño minimalista con solo la X, sin círculo de fondo
- Mejoras visuales generales:
  - Sombras más sutiles y graduales
  - Mejor contraste y legibilidad
  - Transiciones suaves con cubic-bezier
  - Espaciado optimizado para mejor respiración visual
  - Jerarquía tipográfica mejorada
  - Estados hover y feedback visual refinados

**Funcionalidad - Glosario de Colores:**
- Permite crear un glosario personalizado asociando nombres a colores de post-its
- Visualización como badges con círculo de color y nombre
- Edición inline con doble clic
- Persistencia completa en base de datos
- Integrado entre el título del tablero y las columnas

## 🔄 Migración de Base de Datos

Si estás actualizando desde una versión anterior con sistema PIN:

1. **Backup de datos**: Realiza un backup de tu base de datos antes de migrar
2. **Ejecutar migración**: Copia y ejecuta el contenido de `database/migration_users.sql` en el SQL Editor de Neon
3. **Datos existentes**: Si tienes datos en boards, el script incluye opciones para migrarlos a un usuario
4. **Nuevos usuarios**: Los nuevos usuarios deberán registrarse con email/password

**Nota**: Esta migración elimina el sistema PIN y requiere que los usuarios se registren nuevamente.

## 📝 Licencia

Este proyecto es de uso personal. Todos los derechos reservados.

## 🤝 Contribuciones

Este es un proyecto personal, pero las sugerencias y mejoras son bienvenidas a través de Issues.

## 📧 Contacto

Para preguntas o sugerencias, abre un Issue en el repositorio.

---

Hecho con ❤️ usando Nuxt 3 y Vue 3
