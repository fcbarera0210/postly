# Postly

> **Postly** es una aplicación personal tipo Trello para organizar tareas de forma visual mediante post-its en un tablero. Está pensada para uso individual, con foco en simplicidad, velocidad y claridad mental.

---

## 🎯 Propósito del proyecto

- Tener un tablero visual simple para organizar tareas personales
- Reducir fricción: crear, mover y completar tareas sin complejidad
- Evitar sobre-ingeniería y dependencias innecesarias
- Servir como proyecto personal real de uso diario

Postly **no busca competir con Trello** ni ser una plataforma colaborativa.

---

## 🧠 Principios del proyecto

- **Simple > Completo**
- **Visual > Textual**
- **Local-first**
- **Una sola responsabilidad**: ordenar tareas
- **UX fluida antes que features**

Si una funcionalidad no ayuda directamente a organizar tareas, no entra.

---

## 📦 Alcance funcional (MVP)

### Tablero
- Tablero único
- Nombre editable del tablero
- Persistente entre dispositivos

### Columnas
- Mínimo **3 columnas obligatorias** (ej: Por hacer / En progreso / Hecho)
- Crear nuevas columnas
- Eliminar columnas (respetando mínimo 3)
- Reordenar columnas (drag & drop)

### Tareas (post-its)
- Tareas simples
- Contenido:
  - Título (obligatorio)
  - Color (opcional, para diferenciar proyectos o contexto)
- Crear tareas
- Eliminar tareas
- Mover tareas:
  - Dentro de la misma columna
  - Entre columnas (drag & drop)

❌ No incluye:
- Descripciones largas
- Fechas
- Prioridades
- Checklists
- Comentarios

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

## 🔐 Seguridad (sin login)

Postly no tendrá autenticación de usuarios.

### Medida de seguridad ligera
- **PIN local**:
  - Se solicita al abrir la app
  - Se guarda **hasheado** en la base de datos
  - Protege el acceso casual (no es seguridad bancaria)

Objetivo del PIN:
- Evitar accesos accidentales
- Mantener simplicidad

---

## 🗄️ Persistencia de datos

### Base de datos
- **Neon (Postgres serverless)**
- Sin backend propio
- Acceso directo desde el frontend

### Motivo de usar Neon
- Persistencia real (no localStorage)
- Acceso desde PC y celular
- No depender de Firebase
- Mantener arquitectura simple

---

## 🧱 Modelo de datos

### Board
```ts
Board {
  id: string
  name: string
  pinHash: string
}
```

### Column
```ts
Column {
  id: string
  boardId: string
  title: string
  order: number
}
```

### Task
```ts
Task {
  id: string
  columnId: string
  title: string
  color?: string
  order: number
  createdAt: number
}
```

- El orden visual se controla con el campo `order`
- El color es solo decorativo / contextual

---

## ⚙️ Stack tecnológico

### Frontend
- **Nuxt 3**
- **Vue 3 (Composition API)**
- **CSS puro** (sin frameworks)
- **vue-draggable-plus** para drag & drop

### Infraestructura
- **Vercel** (deploy)
- **Neon** (Postgres serverless)

### Lo que NO se usa
- Firebase
- Backend propio
- Frameworks CSS
- Librerías UI pesadas

---

## 📁 Estructura del proyecto

```txt
postly/
├─ pages/
│  └─ index.vue        # Tablero principal
├─ components/
│  ├─ Board.vue
│  ├─ Column.vue
│  ├─ TaskCard.vue
│  └─ PinGate.vue
├─ composables/
│  ├─ useBoard.ts
│  ├─ useColumns.ts
│  └─ useTasks.ts
├─ utils/
│  ├─ db.ts            # conexión Neon
│  ├─ security.ts      # hash PIN
│  └─ theme.ts
├─ assets/
│  └─ styles/
│     ├─ variables.css
│     └─ base.css
└─ app.vue
```

---

## 🧩 Componentes clave

### Board.vue
- Contenedor del tablero
- Maneja columnas y layout general

### Column.vue
- Renderiza columna
- Drag & drop de tareas
- Crear / eliminar tareas

### TaskCard.vue
- Representación visual del post-it
- Manejo de color

### PinGate.vue
- Pantalla inicial
- Solicita PIN
- Bloquea acceso si no es válido

---

## 🧠 Decisiones conscientes

- **Sin auth**: reduce complejidad
- **Sin backend**: foco en UX
- **Sin exceso de features**: evita abandono
- **CSS puro**: control total del diseño

---

## 🚫 Fuera de alcance explícito

- Colaboración
- Usuarios múltiples
- Compartir tableros
- Fechas y recordatorios
- Notificaciones
- Analytics

Si una idea entra aquí, se descarta.

---

## 📌 Identidad

**Nombre:** Postly  
**Tagline:** _Tareas simples, mente clara_

Postly es una herramienta personal. Si crece, será por necesidad real, no por ambición.

