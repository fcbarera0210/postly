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
- 🖱️ **Crear tareas desde glosario** - Click en elementos del glosario para crear tareas rápidamente
- 🔄 **Drag & Drop** - Mueve tareas entre columnas o reordénalas fácilmente
- 👤 **Autenticación por email/password** - Sistema de usuarios con registro e inicio de sesión
- 💾 **Sesión persistente** - Tu sesión se mantiene al recargar la página
- 📧 **Recordar email** - Opción para guardar tu email en el login
- 🔒 **Tableros privados** - Cada usuario tiene su propio tablero aislado
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
- **Heroicons** - Librería de iconos SVG gratuita
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
│   ├── LoginGate.vue   # Pantalla de autenticación (login/registro)
│   └── Footer.vue      # Footer con información de desarrollo
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
│       └── variables.css # Variables CSS (incluye colores de marca)
├── public/             # Archivos públicos
│   ├── logo-svg/       # Logos en formato SVG
│   │   └── Logo-Postly.svg
│   └── logo-png/       # Logos en formato PNG
│       └── Logo-Postly.png
├── pages/              # Páginas de Nuxt
│   └── index.vue       # Página principal
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

### Glosario de Colores
- ✅ Crear elementos del glosario asociando nombres a colores
- ✅ Editar nombres de elementos (doble clic en desktop, long press en móvil)
- ✅ Eliminar elementos del glosario
- ✅ Visualización como badges con círculo de color y nombre
- ✅ Scroll horizontal en mobile sin mostrar barra de scroll
- ✅ Persistencia en base de datos
- ✅ **Crear tareas desde glosario** - Click en un elemento del glosario para crear una tarea en la primera columna con el color y nombre pre-configurados

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

### Versión Actual - Persistencia y Productividad

**Nuevas Funcionalidades:**
- ✅ **Sesión persistente**: La sesión ahora se guarda en `localStorage` en lugar de `sessionStorage`, permitiendo que la sesión persista al recargar la página
- ✅ **Recordar email**: Checkbox en el formulario de login para guardar el email y pre-llenarlo automáticamente en futuros inicios de sesión
- ✅ **Crear tareas desde glosario**: Click en cualquier elemento del glosario para crear rápidamente una tarea en la primera columna (izquierda a derecha) con:
  - Color del glosario pre-seleccionado
  - Nombre del glosario como título inicial (editable)
  - Focus automático en el input para escribir inmediatamente
  - Detección inteligente de doble click para evitar conflictos con la edición

**Mejoras de UX:**
- ✅ Mejor espaciado en el formulario de login entre campos, checkbox y botón
- ✅ Experiencia más fluida al crear tareas desde el glosario

### Versión Anterior - Mejoras Mobile y UX

**Mejoras Mobile:**
- ✅ **Edición con long press**: En dispositivos móviles, mantén presionado cualquier elemento editable (tareas, columnas, tablero, glosario) para entrar en modo edición, evitando el problema del zoom con doble tap
- ✅ **Glosario horizontal**: En mobile, el glosario se muestra en scroll horizontal sin mostrar la barra de scroll para mejor experiencia
- ✅ **Footer optimizado**: Footer adaptado para mobile manteniendo todo en una sola línea
- ✅ **Iconos modernos**: Botones del header convertidos a iconos usando Heroicons (PlusIcon y ArrowRightOnRectangleIcon)
- ✅ **Header compacto**: Botones de acción alineados horizontalmente con logo y título del tablero

**Mejoras de Accesibilidad:**
- ✅ Colores del footer adaptativos al tema (claro/oscuro) usando variables CSS
- ✅ Iconos con aria-labels para mejor accesibilidad
- ✅ Soporte completo de touch events para dispositivos móviles

**Stack Actualizado:**
- ✅ **Heroicons** - Librería de iconos gratuita y moderna

### Versión Anterior - Branding y Diseño

**Nueva Identidad Visual:**
- ✅ Logo de Postly integrado en toda la aplicación
- ✅ Logo en el header del tablero (izquierda del nombre)
- ✅ Logo prominente en la página de login
- ✅ Favicon personalizado con el logo
- ✅ Meta tags Open Graph configurados para compartir URLs
- ✅ Sistema de colores de marca alineado con el logo (#FF5A4D)
- ✅ Variables CSS para colores de marca con estados hover/active
- ✅ Soporte para modo claro y oscuro con variantes de color optimizadas

**Sistema de Colores:**
- Color principal de marca: `#FF5A4D` (del logo)
- Estados interactivos: hover y active con variaciones del color de marca
- Colores de post-its mantenidos independientes (amarillo, rosa, azul, verde, etc.)
- Mejor contraste y accesibilidad en ambos modos (claro/oscuro)

### Versión Anterior - Sistema de Usuarios

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

**Mejoras de Interfaz:**
- ✅ Footer con información de desarrollo y logo
- ✅ Diseño responsive del footer
- ✅ Integración del logo SVG inline para mejor rendimiento

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
