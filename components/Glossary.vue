<template>
  <div class="glossary">
    <div class="glossary__label">Glosario:</div>
    <div class="glossary__items">
      <div
        v-for="item in glossaryItems"
        :key="item.id"
        class="glossary__badge"
        :class="{ 'glossary__badge--editing': editingItemId === item.id }"
      >
        <input
          v-if="editingItemId === item.id"
          v-model="editedName"
          class="glossary__badge-input"
          @blur="handleSaveEdit(item.id)"
          @keyup.enter="handleSaveEdit(item.id)"
          @keyup.esc="cancelEdit"
          ref="editInputRef"
        />
        <div 
          v-else 
          class="glossary__badge-content" 
          @dblclick="startEdit(item)"
          @touchstart.stop="handleTouchStart(item, $event)"
          @touchend.stop="handleTouchEnd"
          @touchmove.stop="handleTouchMove"
        >
          <span
            class="glossary__badge-color"
            :style="{ backgroundColor: getColorBg(item.color) }"
          ></span>
          <span class="glossary__badge-name">{{ item.name }}</span>
        </div>
        <button
          class="glossary__badge-delete"
          @click="handleDelete(item.id)"
          aria-label="Eliminar elemento"
        >
          ×
        </button>
      </div>
      <button
        class="glossary__add"
        @click="showAddForm = true"
        aria-label="Agregar elemento al glosario"
      >
        +
      </button>
    </div>

    <div v-if="showAddForm" class="glossary__modal" @click.self="cancelAdd">
      <div class="glossary__form">
        <h3 class="glossary__form-title">Nuevo Elemento del Glosario</h3>
        <input
          v-model="newItemName"
          class="glossary__form-input"
          placeholder="Nombre del elemento..."
          maxlength="50"
          @keyup.enter="handleAdd"
          @keyup.esc="cancelAdd"
          ref="nameInputRef"
        />
        <div v-if="newItemName.length > 0 && newItemName.length < 3" class="glossary__form-error">
          El nombre debe tener al menos 3 caracteres
        </div>
        <div class="glossary__color-picker">
          <button
            v-for="color in availableColors"
            :key="color.value"
            class="glossary__color-option"
            :class="{ 'glossary__color-option--active': selectedColor === color.value }"
            :style="{ backgroundColor: color.bg }"
            @click="selectedColor = color.value"
            :aria-label="`Color ${color.label}`"
          />
        </div>
        <div class="glossary__form-actions">
          <button
            class="glossary__form-button glossary__form-button--primary"
            @click="handleAdd"
            :disabled="!newItemName.trim() || newItemName.trim().length < 3 || !selectedColor"
          >
            Agregar
          </button>
          <button
            class="glossary__form-button"
            @click="cancelAdd"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useGlossary } from '~/composables/useGlossary'
import type { GlossaryItem } from '~/utils/db'

const props = defineProps<{
  boardId: string | null
}>()

const { glossaryItems, loadGlossary, create, remove, update } = useGlossary(() => props.boardId)

const showAddForm = ref(false)
const newItemName = ref('')
const selectedColor = ref<string | null>(null)
const nameInputRef = ref<HTMLInputElement | null>(null)

const editingItemId = ref<string | null>(null)
const editedName = ref('')
const editInputRef = ref<HTMLInputElement | null>(null)

// Long press para móvil
let longPressTimer: ReturnType<typeof setTimeout> | null = null
let longPressItem: GlossaryItem | null = null
const LONG_PRESS_DURATION = 500 // ms

const availableColors = [
  { value: 'yellow', label: 'Amarillo', bg: 'var(--postit-yellow)' },
  { value: 'pink', label: 'Rosa', bg: 'var(--postit-pink)' },
  { value: 'blue', label: 'Azul', bg: 'var(--postit-blue)' },
  { value: 'green', label: 'Verde', bg: 'var(--postit-green)' },
  { value: 'orange', label: 'Naranja', bg: 'var(--postit-orange)' },
  { value: 'purple', label: 'Morado', bg: 'var(--postit-purple)' },
  { value: 'red', label: 'Rojo', bg: 'var(--postit-red)' },
  { value: 'cyan', label: 'Cian', bg: 'var(--postit-cyan)' }
]

function getColorBg(color: string): string {
  const colorMap: Record<string, string> = {
    yellow: 'var(--postit-yellow)',
    pink: 'var(--postit-pink)',
    blue: 'var(--postit-blue)',
    green: 'var(--postit-green)',
    orange: 'var(--postit-orange)',
    purple: 'var(--postit-purple)',
    red: 'var(--postit-red)',
    cyan: 'var(--postit-cyan)'
  }
  return colorMap[color] || 'var(--postit-default)'
}

async function handleAdd() {
  if (!newItemName.value.trim() || newItemName.value.trim().length < 3 || !selectedColor.value) {
    return
  }

  try {
    await create(newItemName.value.trim(), selectedColor.value)
    newItemName.value = ''
    selectedColor.value = null
    showAddForm.value = false
  } catch (err) {
    alert('Error al crear el elemento del glosario. Por favor, intenta nuevamente.')
  }
}

function cancelAdd() {
  newItemName.value = ''
  selectedColor.value = null
  showAddForm.value = false
}

function startEdit(item: GlossaryItem) {
  editedName.value = item.name
  editingItemId.value = item.id
  nextTick(() => {
    editInputRef.value?.focus()
    editInputRef.value?.select()
  })
}

async function handleSaveEdit(itemId: string) {
  if (editedName.value.trim() && editedName.value.trim().length >= 3) {
    try {
      await update(itemId, editedName.value.trim())
    } catch (err) {
      alert('Error al actualizar el elemento del glosario. Por favor, intenta nuevamente.')
    }
  }
  editingItemId.value = null
  editedName.value = ''
}

function cancelEdit() {
  editingItemId.value = null
  editedName.value = ''
}

// Handlers para long press en móvil
function handleTouchStart(item: GlossaryItem, e: TouchEvent) {
  // Solo activar si no está en modo edición
  if (editingItemId.value === item.id) return
  
  // Prevenir zoom accidental
  e.preventDefault()
  
  longPressItem = item
  longPressTimer = setTimeout(() => {
    if (longPressItem) {
      startEdit(longPressItem)
      longPressItem = null
    }
    longPressTimer = null
  }, LONG_PRESS_DURATION)
}

function handleTouchEnd() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
    longPressItem = null
  }
}

function handleTouchMove() {
  // Cancelar si el usuario mueve el dedo
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
    longPressItem = null
  }
}

async function handleDelete(itemId: string) {
  if (!confirm('¿Estás seguro de que quieres eliminar este elemento del glosario?')) {
    return
  }

  try {
    await remove(itemId)
  } catch (err) {
    alert('Error al eliminar el elemento del glosario. Por favor, intenta nuevamente.')
  }
}

watch(() => props.boardId, async (newBoardId) => {
  if (newBoardId) {
    await loadGlossary()
  }
}, { immediate: true })

watch(showAddForm, (show) => {
  if (show) {
    nextTick(() => {
      nameInputRef.value?.focus()
    })
  }
})
</script>

<style scoped>
.glossary {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
}

.glossary__label {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  white-space: nowrap;
}

.glossary__items {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .glossary {
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE/Edge */
    -webkit-overflow-scrolling: touch;
  }
  
  .glossary::-webkit-scrollbar {
    display: none; /* Chrome/Safari */
  }
  
  .glossary__items {
    flex-wrap: nowrap;
    flex-shrink: 0;
  }
  
  .glossary__label {
    flex-shrink: 0;
  }
  
  .glossary__badge {
    flex-shrink: 0;
  }
  
  .glossary__add {
    flex-shrink: 0;
  }
}

.glossary__badge {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  position: relative;
  transition: all var(--transition-base);
}

.glossary__badge:hover {
  box-shadow: var(--shadow-sm);
  border-color: var(--text-secondary);
}

.glossary__badge-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  flex: 1;
}

.glossary__badge-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.glossary__badge-name {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.glossary__badge-input {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  background: var(--bg-primary);
  border: 2px solid var(--brand-primary);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  min-width: 100px;
}

.glossary__badge-delete {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  font-size: 20px;
  line-height: 1;
  opacity: 0;
  transition: opacity var(--transition-base), color var(--transition-base), transform var(--transition-base);
  padding: var(--spacing-xs);
  cursor: pointer;
  margin-left: var(--spacing-xs);
}

.glossary__badge:hover .glossary__badge-delete {
  opacity: 1;
}

.glossary__badge-delete:hover {
  color: #d32f2f;
  transform: scale(1.2);
}

.glossary__badge-delete:active {
  transform: scale(1.1);
}

.glossary__add {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--bg-secondary);
  border: 1px dashed var(--border-color);
  border-radius: var(--border-radius-md);
  color: var(--text-secondary);
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  transition: all var(--transition-base);
  font-weight: var(--font-weight-medium);
}

.glossary__add:hover {
  background: var(--bg-primary);
  border-color: var(--brand-primary);
  color: var(--text-primary);
  transform: scale(1.1);
}

.glossary__add:active {
  transform: scale(1.05);
}

.glossary__modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.glossary__form {
  background: var(--bg-secondary);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-xl);
  min-width: 300px;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  .glossary__form {
    min-width: 90%;
    max-width: 90%;
    padding: var(--spacing-lg);
  }
}

.glossary__form-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  margin-bottom: var(--spacing-sm);
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.glossary__form-input {
  width: 100%;
  font-size: var(--font-size-base);
}

.glossary__form-error {
  color: #d32f2f;
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-xs);
}

.glossary__color-picker {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.glossary__color-option {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform var(--transition-base), border-color var(--transition-base), box-shadow var(--transition-base);
}

.glossary__color-option:hover {
  transform: scale(1.15);
  box-shadow: var(--shadow-sm);
}

.glossary__color-option:active {
  transform: scale(1.05);
}

.glossary__color-option--active {
  border-color: var(--text-primary);
  transform: scale(1.2);
  box-shadow: var(--shadow-md);
}

.glossary__form-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xs);
}

.glossary__form-button {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-base);
}

.glossary__form-button--primary {
  background: var(--brand-primary);
  color: white;
}

.glossary__form-button--primary:hover:not(:disabled) {
  background: var(--brand-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.glossary__form-button--primary:active:not(:disabled) {
  background: var(--brand-primary-active);
  transform: translateY(0);
}

.glossary__form-button:not(.glossary__form-button--primary) {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.glossary__form-button:not(.glossary__form-button--primary):hover {
  background: var(--bg-primary);
  border-color: var(--text-secondary);
}

.glossary__form-button:not(.glossary__form-button--primary):active {
  transform: scale(0.98);
}
</style>
