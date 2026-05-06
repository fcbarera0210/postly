<template>
  <div class="boards-page">
    <header class="boards-page__header">
      <img src="/logo-svg/Logo-Postly.svg" alt="Postly" class="boards-page__logo" />
      <div class="boards-page__header-actions">
        <button type="button" class="boards-page__profile" @click="openProfile">Perfil</button>
        <button type="button" class="boards-page__logout" @click="handleLogout">Cerrar sesión</button>
      </div>
    </header>

    <main class="boards-page__main">
      <h1 class="boards-page__title">{{ pageHeading }}</h1>

      <section class="boards-page__section">
        <h2 class="boards-page__subtitle">Crear tablero</h2>
        <form class="boards-page__form" @submit.prevent="handleCreate">
          <input
            v-model="newBoardName"
            class="boards-page__input"
            placeholder="Nombre del tablero"
            maxlength="80"
            required
          />
          <button type="submit" class="boards-page__btn boards-page__btn--primary" :disabled="creating">
            {{ creating ? 'Creando…' : 'Crear' }}
          </button>
        </form>
      </section>

      <section class="boards-page__section">
        <h2 class="boards-page__subtitle">Unirse con ID</h2>
        <p class="boards-page__hint">
          Pide a la persona dueña del tablero su ID. Se enviará una solicitud para que la apruebe.
        </p>
        <form class="boards-page__form" @submit.prevent="handleJoin">
          <input
            v-model="joinBoardId"
            class="boards-page__input boards-page__input--mono"
            placeholder="ID del tablero"
            autocomplete="off"
          />
          <button type="submit" class="boards-page__btn" :disabled="joining || !joinBoardId.trim()">
            {{ joining ? 'Enviando…' : 'Solicitar acceso' }}
          </button>
        </form>
      </section>

      <section class="boards-page__section">
        <h2 class="boards-page__subtitle">Mis tableros</h2>
        <div v-if="loading" class="boards-page__loading">Cargando…</div>
        <template v-else>
          <ul v-if="boardsOwned.length" class="boards-page__list">
            <li v-for="b in boardsOwned" :key="b.id" class="boards-page__item">
              <NuxtLink :to="`/boards/${b.id}`" class="boards-page__link">
                <span class="boards-page__link-name">{{ b.name }}</span>
                <span class="boards-page__link-meta">Dueño</span>
              </NuxtLink>
              <button
                type="button"
                class="boards-page__copy"
                :aria-label="'Copiar ID del tablero ' + b.name"
                @click="copyId(b.id)"
              >
                {{ copiedBoardId === b.id ? 'Copiado' : 'Copiar ID' }}
              </button>
            </li>
          </ul>
          <p v-else class="boards-page__empty boards-page__empty--inline">No tienes tableros propios aún.</p>
        </template>
      </section>

      <section class="boards-page__section">
        <h2 class="boards-page__subtitle">Compartidos conmigo</h2>
        <div v-if="loading" class="boards-page__loading">Cargando…</div>
        <template v-else>
          <ul v-if="boardsShared.length" class="boards-page__list">
            <li v-for="b in boardsShared" :key="b.id" class="boards-page__item">
              <NuxtLink :to="`/boards/${b.id}`" class="boards-page__link">
                <span class="boards-page__link-name">{{ b.name }}</span>
                <span class="boards-page__link-meta">Editor</span>
              </NuxtLink>
              <button
                type="button"
                class="boards-page__copy"
                :aria-label="'Copiar ID del tablero ' + b.name"
                @click="copyId(b.id)"
              >
                {{ copiedBoardId === b.id ? 'Copiado' : 'Copiar ID' }}
              </button>
            </li>
          </ul>
          <p v-else class="boards-page__empty boards-page__empty--inline">Nadie te ha invitado como editor todavía.</p>
        </template>
      </section>

      <p v-if="!loading && !boards.length" class="boards-page__empty boards-page__empty--global">
        No tienes tableros aún. Crea uno arriba o únete con un ID.
      </p>
      <span class="boards-page__aria-live" aria-live="polite">{{ copyAnnounce }}</span>
    </main>

    <div
      v-if="profileOpen"
      class="boards-page__modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      @mousedown="profileBackdrop.onBackdropMouseDown"
      @mouseup="profileBackdrop.onBackdropMouseUp"
    >
      <div class="boards-page__modal" @keydown.escape="closeProfile">
        <h2 id="profile-modal-title" class="boards-page__modal-title">Tu perfil</h2>
        <p class="boards-page__profile-email">
          <span class="boards-page__profile-label">Email</span>
          {{ profileEmail }}
        </p>
        <label class="boards-page__profile-label boards-page__profile-label--block" for="profile-display-name">
          Nombre visible
        </label>
        <input
          id="profile-display-name"
          v-model="profileDraft"
          class="boards-page__input"
          maxlength="80"
          placeholder="Cómo te mostramos en el tablero"
          autocomplete="nickname"
        />
        <span class="boards-page__profile-label boards-page__profile-label--block">Color de acento</span>
        <div class="boards-page__accent-row" role="group" aria-label="Color de acento de la interfaz">
          <button
            type="button"
            class="boards-page__accent-swatch boards-page__accent-swatch--brand"
            :class="{ 'boards-page__accent-swatch--active': profileAccentDraft === null }"
            title="Coral (marca por defecto)"
            aria-label="Coral, marca por defecto"
            @click="profileAccentDraft = null"
          />
          <button
            v-for="c in POSTIT_COLOR_OPTIONS"
            :key="c.value"
            type="button"
            class="boards-page__accent-swatch"
            :style="{ background: c.bg }"
            :class="{ 'boards-page__accent-swatch--active': profileAccentDraft === c.value }"
            :title="c.label"
            :aria-label="c.label"
            @click="profileAccentDraft = c.value"
          />
        </div>
        <div class="boards-page__modal-actions">
          <button
            type="button"
            class="boards-page__btn boards-page__btn--primary"
            :disabled="profileSaving"
            @click="saveProfile"
          >
            {{ profileSaving ? 'Guardando…' : 'Guardar' }}
          </button>
          <button type="button" class="boards-page__btn" @click="closeProfile">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Board, User } from '~/utils/types'
import { apiFetch } from '~/composables/useApi'
import { useAuth } from '~/composables/useAuth'
import { usePostlyToast } from '~/composables/usePostlyToast'
import { useBackdropClose } from '~/composables/useBackdropClose'
import { userLabel } from '~/utils/userLabel'
import { POSTIT_COLOR_OPTIONS } from '~/utils/postitColors'
definePageMeta({
  middleware: 'auth'
})

const { logout, getCurrentUser, updateProfile } = useAuth()
const { showError, success } = usePostlyToast()

const boards = ref<Board[]>([])
const loading = ref(true)
const newBoardName = ref('')
const creating = ref(false)
const joinBoardId = ref('')
const joining = ref(false)

const currentUser = ref<User | null>(null)
const profileOpen = ref(false)
const profileDraft = ref('')
const profileAccentDraft = ref<string | null>(null)
const profileEmail = ref('')
const profileSaving = ref(false)
const profileBackdrop = useBackdropClose(() => closeProfile())
const copiedBoardId = ref<string | null>(null)
const copyAnnounce = ref('')
let copyTimer: ReturnType<typeof setTimeout> | null = null

const boardsOwned = computed(() => boards.value.filter((b) => b.role === 'owner'))
const boardsShared = computed(() => boards.value.filter((b) => b.role === 'editor'))

const pageHeading = computed(() => {
  if (currentUser.value) {
    return `Hola, ${userLabel(currentUser.value)}`
  }
  return 'Tus tableros'
})

async function loadBoards() {
  loading.value = true
  try {
    boards.value = await apiFetch<Board[]>('/api/boards')
  } catch (e: unknown) {
    showError(e, 'No se pudieron cargar los tableros.')
    boards.value = []
  } finally {
    loading.value = false
  }
}

async function refreshUser() {
  currentUser.value = await getCurrentUser()
}

onMounted(async () => {
  await refreshUser()
  await loadBoards()
})

function openProfile() {
  profileEmail.value = currentUser.value?.email ?? ''
  profileDraft.value = currentUser.value?.display_name ?? ''
  profileAccentDraft.value = currentUser.value?.accent_color ?? null
  profileOpen.value = true
}

function closeProfile() {
  profileOpen.value = false
}

async function saveProfile() {
  profileSaving.value = true
  try {
    const trimmed = profileDraft.value.trim()
    const nextUser = await updateProfile({
      display_name: trimmed.length ? trimmed : null,
      accent_color: profileAccentDraft.value
    })
    currentUser.value = nextUser
    success('Perfil guardado')
    closeProfile()
  } catch (e: unknown) {
    showError(e, 'No se pudo guardar el perfil.')
  } finally {
    profileSaving.value = false
  }
}

async function handleCreate() {
  const name = newBoardName.value.trim()
  if (!name) return
  creating.value = true
  try {
    await apiFetch('/api/boards', {
      method: 'POST',
      body: {
        name,
        initialColumnTitles: ['Por hacer', 'En progreso', 'Hecho']
      }
    })
    newBoardName.value = ''
    await loadBoards()
    success('Tablero creado')
  } catch (e: unknown) {
    showError(e, 'No se pudo crear el tablero.')
  } finally {
    creating.value = false
  }
}

async function handleJoin() {
  const boardId = joinBoardId.value.trim()
  if (!boardId) return
  joining.value = true
  try {
    await apiFetch('/api/boards/join', {
      method: 'POST',
      body: { boardId }
    })
    joinBoardId.value = ''
    success('Solicitud enviada. El dueño debe aprobarla desde el tablero.')
  } catch (e: unknown) {
    showError(e, 'No se pudo enviar la solicitud.')
  } finally {
    joining.value = false
  }
}

function copyId(id: string) {
  if (import.meta.client && navigator.clipboard) {
    navigator.clipboard
      .writeText(id)
      .then(() => {
        success('ID del tablero copiado')
        copiedBoardId.value = id
        copyAnnounce.value = 'ID copiado al portapapeles'
        if (copyTimer) clearTimeout(copyTimer)
        copyTimer = setTimeout(() => {
          copiedBoardId.value = null
          copyAnnounce.value = ''
        }, 2500)
      })
      .catch(() => {
        showError('No se pudo copiar al portapapeles.')
      })
  }
}

function handleLogout() {
  logout()
  window.location.href = '/'
}
</script>

<style scoped>
.boards-page {
  min-height: 100vh;
  padding: var(--spacing-lg);
  max-width: 640px;
  margin: 0 auto;
}

.boards-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-2xl);
  gap: var(--spacing-md);
}

.boards-page__logo {
  height: 40px;
  width: auto;
}

.boards-page__header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.boards-page__profile {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.boards-page__logout {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.boards-page__title {
  font-size: var(--font-size-2xl);
  margin-bottom: var(--spacing-xl);
  color: var(--text-primary);
}

.boards-page__section {
  margin-bottom: var(--spacing-2xl);
}

.boards-page__subtitle {
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
}

.boards-page__hint {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
}

.boards-page__form {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  align-items: center;
}

.boards-page__input {
  flex: 1;
  min-width: 200px;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
}

.boards-page__input--mono {
  font-family: ui-monospace, monospace;
  font-size: var(--font-size-sm);
}

.boards-page__btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  cursor: pointer;
  color: var(--text-primary);
}

.boards-page__btn--primary {
  background: var(--brand-primary);
  color: white;
  border-color: var(--brand-primary);
}

.boards-page__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.boards-page__error {
  color: #d32f2f;
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-sm);
}

.boards-page__success {
  color: #2e7d32;
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-sm);
}

.boards-page__list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.boards-page__item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  border-bottom: 1px solid var(--border-color);
  padding: var(--spacing-md) 0;
}

.boards-page__link {
  flex: 1;
  text-decoration: none;
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.boards-page__link-name {
  font-weight: var(--font-weight-semibold);
}

.boards-page__link-meta {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.boards-page__copy {
  font-size: var(--font-size-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  cursor: pointer;
  color: var(--text-secondary);
  min-width: 72px;
}

.boards-page__empty,
.boards-page__loading {
  color: var(--text-secondary);
}

.boards-page__empty--inline {
  font-size: var(--font-size-sm);
  margin: 0;
}

.boards-page__empty--global {
  margin-top: var(--spacing-md);
  text-align: center;
}

.boards-page__aria-live {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.boards-page__modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-md);
}

.boards-page__modal {
  background: var(--bg-secondary);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-xl);
  max-width: 420px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.boards-page__modal-title {
  font-size: var(--font-size-lg);
  margin: 0;
}

.boards-page__profile-email {
  margin: 0;
  font-size: var(--font-size-sm);
  word-break: break-all;
}

.boards-page__profile-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-right: var(--spacing-xs);
}

.boards-page__profile-label--block {
  display: block;
  margin-bottom: var(--spacing-xs);
}

.boards-page__modal-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.boards-page__accent-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  align-items: center;
}

.boards-page__accent-swatch {
  width: 28px;
  height: 28px;
  border-radius: var(--border-radius-sm);
  border: 2px solid var(--border-color);
  cursor: pointer;
  padding: 0;
  box-sizing: border-box;
}

.boards-page__accent-swatch--brand {
  background: linear-gradient(135deg, #ff5a4d, #ff7a6d);
}

.boards-page__accent-swatch:hover {
  filter: brightness(0.97);
}

.boards-page__accent-swatch--active {
  outline: 2px solid var(--brand-primary);
  outline-offset: 2px;
}
</style>
