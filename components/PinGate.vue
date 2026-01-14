<template>
  <div class="pin-gate">
    <div class="pin-gate__container">
      <h1 class="pin-gate__title">Postly</h1>
      <p class="pin-gate__subtitle">Tareas simples, mente clara</p>
      
      <form @submit.prevent="handleSubmit" class="pin-gate__form">
        <div v-if="error" class="pin-gate__error">{{ error }}</div>
        
        <div class="pin-gate__input-group">
          <label for="pin" class="pin-gate__label">
            {{ isFirstTime ? 'Establece tu PIN (mínimo 4 caracteres)' : 'Ingresa tu PIN' }}
          </label>
          <input
            id="pin"
            v-model="pin"
            type="password"
            class="pin-gate__input"
            placeholder="••••"
            maxlength="10"
            autocomplete="off"
            :disabled="loading"
            @input="clearError"
          />
        </div>
        
        <button
          type="submit"
          class="pin-gate__button"
          :disabled="!pin || pin.length < 4 || loading"
        >
          <span v-if="loading">Verificando...</span>
          <span v-else>{{ isFirstTime ? 'Crear tablero' : 'Acceder' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { hashPin, verifyPin } from '~/utils/security'
import { getBoard, createBoard } from '~/utils/db'
import { nanoid } from 'nanoid'

const emit = defineEmits<{
  authenticated: []
}>()

const pin = ref('')
const loading = ref(false)
const error = ref('')
const isFirstTime = ref(false)

onMounted(async () => {
  // Verificar si ya existe un board
  try {
    const board = await getBoard()
    isFirstTime.value = !board
  } catch (err) {
    // Si hay error (probablemente la BD no está configurada o no hay tablas), asumimos primera vez
    isFirstTime.value = true
  }
})

function clearError() {
  error.value = ''
}

async function handleSubmit() {
  if (!pin.value || pin.value.length < 4) {
    error.value = 'El PIN debe tener al menos 4 caracteres'
    return
  }

  loading.value = true
  error.value = ''

  try {
    if (isFirstTime.value) {
      // Primera vez: crear board con PIN hasheado
      const pinHash = await hashPin(pin.value)
      const boardId = nanoid()
      await createBoard(boardId, 'Mi Tablero', pinHash)
      
      // Crear columnas iniciales
      const { createColumn } = await import('~/utils/db')
      const columnTitles = ['Por hacer', 'En progreso', 'Hecho']
      for (let i = 0; i < columnTitles.length; i++) {
        const columnId = nanoid()
        await createColumn(columnId, boardId, columnTitles[i], i)
      }
      
      // Guardar sesión
      sessionStorage.setItem('postly_authenticated', 'true')
      sessionStorage.setItem('postly_timestamp', Date.now().toString())
      
      emit('authenticated')
    } else {
      // Verificar PIN existente
      const board = await getBoard()
      if (!board) {
        error.value = 'No se encontró el tablero'
        return
      }

      const isValid = await verifyPin(pin.value, board.pin_hash)
      if (!isValid) {
        error.value = 'PIN incorrecto'
        return
      }

      // Guardar sesión
      sessionStorage.setItem('postly_authenticated', 'true')
      sessionStorage.setItem('postly_timestamp', Date.now().toString())
      
      emit('authenticated')
    }
  } catch (err) {
    error.value = 'Error al verificar PIN. Intenta nuevamente.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.pin-gate {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  padding: var(--spacing-md);
}

.pin-gate__container {
  width: 100%;
  max-width: 400px;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-lg);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .pin-gate__container {
    padding: var(--spacing-xl);
    max-width: 100%;
  }
}

.pin-gate__title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  text-align: center;
  margin-bottom: var(--spacing-xs);
  color: var(--text-primary);
}

.pin-gate__subtitle {
  text-align: center;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xl);
  font-size: var(--font-size-sm);
}

.pin-gate__form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.pin-gate__error {
  background: rgba(239, 154, 154, 0.1);
  color: #d32f2f;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  text-align: center;
}

.pin-gate__input-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.pin-gate__label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-primary);
}

.pin-gate__input {
  width: 100%;
  font-size: var(--font-size-lg);
  text-align: center;
  letter-spacing: 0.5em;
  font-weight: 600;
}

.pin-gate__button {
  width: 100%;
  background: var(--brand-primary);
  color: white;
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  font-weight: 600;
  font-size: var(--font-size-base);
  transition: background-color var(--transition-fast), transform var(--transition-fast);
}

.pin-gate__button:hover:not(:disabled) {
  background: var(--brand-primary-hover);
  transform: translateY(-1px);
}

.pin-gate__button:active:not(:disabled) {
  background: var(--brand-primary-active);
  transform: translateY(0);
}

.pin-gate__button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
