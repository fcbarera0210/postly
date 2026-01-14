<template>
  <div class="login-gate">
    <div class="login-gate__container">
      <div class="login-gate__logo-container">
        <img 
          src="/logo-svg/Logo-Postly.svg" 
          alt="Postly Logo" 
          class="login-gate__logo"
        />
      </div>
      
      <div class="login-gate__tabs">
        <button
          class="login-gate__tab"
          :class="{ 'login-gate__tab--active': !isRegisterMode }"
          @click="isRegisterMode = false"
        >
          Iniciar sesión
        </button>
        <button
          class="login-gate__tab"
          :class="{ 'login-gate__tab--active': isRegisterMode }"
          @click="isRegisterMode = true"
        >
          Registrarse
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="login-gate__form">
        <div v-if="error" class="login-gate__error">{{ error }}</div>
        
        <div class="login-gate__input-group">
          <label for="email" class="login-gate__label">Correo electrónico</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="login-gate__input"
            placeholder="tu@email.com"
            autocomplete="email"
            :disabled="loading"
            @input="clearError"
            required
          />
        </div>

        <div class="login-gate__input-group">
          <label for="password" class="login-gate__label">Contraseña</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="login-gate__input"
            placeholder="••••••••"
            autocomplete="current-password"
            :disabled="loading"
            @input="clearError"
            required
          />
          <p v-if="isRegisterMode" class="login-gate__hint">
            Mínimo 6 caracteres
          </p>
        </div>

        <div v-if="isRegisterMode" class="login-gate__input-group">
          <label for="confirmPassword" class="login-gate__label">Confirmar contraseña</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            class="login-gate__input"
            placeholder="••••••••"
            autocomplete="new-password"
            :disabled="loading"
            @input="clearError"
            required
          />
        </div>
        
        <button
          type="submit"
          class="login-gate__button"
          :disabled="!isFormValid || loading"
        >
          <span v-if="loading">{{ isRegisterMode ? 'Registrando...' : 'Iniciando sesión...' }}</span>
          <span v-else>{{ isRegisterMode ? 'Registrarse' : 'Iniciar sesión' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useBoard } from '~/composables/useBoard'
import { createColumn } from '~/utils/db'
import { nanoid } from 'nanoid'

const emit = defineEmits<{
  authenticated: []
}>()

const { login, register } = useAuth()
const { initializeBoard, board } = useBoard()

const isRegisterMode = ref(false)
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')

const isFormValid = computed(() => {
  if (!email.value || !password.value) return false
  if (isRegisterMode.value) {
    if (!confirmPassword.value) return false
    if (password.value !== confirmPassword.value) return false
    if (password.value.length < 6) return false
  }
  return true
})

function clearError() {
  error.value = ''
}

async function handleSubmit() {
  if (!isFormValid.value) {
    if (isRegisterMode.value && password.value !== confirmPassword.value) {
      error.value = 'Las contraseñas no coinciden'
    } else if (isRegisterMode.value && password.value.length < 6) {
      error.value = 'La contraseña debe tener al menos 6 caracteres'
    }
    return
  }

  loading.value = true
  error.value = ''

  try {
    if (isRegisterMode.value) {
      // Registro
      await register(email.value, password.value)
      
      // Crear tablero inicial con columnas por defecto
      await initializeBoard('Mi Tablero')
      if (board.value) {
        const columnTitles = ['Por hacer', 'En progreso', 'Hecho']
        for (let i = 0; i < columnTitles.length; i++) {
          const columnId = nanoid()
          await createColumn(columnId, board.value.id, columnTitles[i], i)
        }
      }
      
      emit('authenticated')
    } else {
      // Login
      await login(email.value, password.value)
      emit('authenticated')
    }
  } catch (err: any) {
    error.value = err.message || 'Error al autenticar. Intenta nuevamente.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-gate {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  padding: var(--spacing-md);
}

.login-gate__container {
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
  .login-gate__container {
    padding: var(--spacing-xl);
    max-width: 100%;
  }
}

.login-gate__logo-container {
  display: flex;
  justify-content: center;
  margin-bottom: var(--spacing-xl);
}

.login-gate__logo {
  height: 100px;
  width: auto;
  object-fit: contain;
}

@media (max-width: 768px) {
  .login-gate__logo {
    height: 80px;
  }
}

.login-gate__title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  text-align: center;
  margin-bottom: var(--spacing-xs);
  color: var(--text-primary);
}

.login-gate__subtitle {
  text-align: center;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xl);
  font-size: var(--font-size-sm);
}

.login-gate__tabs {
  display: flex;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.login-gate__tab {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.login-gate__tab:hover {
  color: var(--text-primary);
}

.login-gate__tab--active {
  color: var(--brand-primary);
  border-bottom-color: var(--brand-primary);
}

.login-gate__form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.login-gate__error {
  background: rgba(239, 154, 154, 0.1);
  color: #d32f2f;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  text-align: center;
}

.login-gate__input-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.login-gate__label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-primary);
}

.login-gate__input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-base);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: border-color var(--transition-fast);
}

.login-gate__input:focus {
  outline: none;
  border-color: var(--brand-primary);
}

.login-gate__input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-gate__hint {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-top: calc(var(--spacing-xs) * -1);
}

.login-gate__button {
  width: 100%;
  background: var(--brand-primary);
  color: white;
  padding: var(--spacing-md);
  border: none;
  border-radius: var(--border-radius-md);
  font-weight: 600;
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: background-color var(--transition-fast), transform var(--transition-fast);
}

.login-gate__button:hover:not(:disabled) {
  background: var(--brand-primary-hover);
  transform: translateY(-1px);
}

.login-gate__button:active:not(:disabled) {
  background: var(--brand-primary-active);
  transform: translateY(0);
}

.login-gate__button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
