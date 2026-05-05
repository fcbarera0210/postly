import { apiFetch } from '~/composables/useApi'
import type { User, UserProfilePatch } from '~/utils/types'

const TOKEN_KEY = 'postly_token'
const USER_EMAIL_KEY = 'postly_user_email'

function parseJwtExp(token: string): number | null {
  try {
    const p = token.split('.')[1]
    if (!p) return null
    const json = JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/')))
    return typeof json.exp === 'number' ? json.exp : null
  } catch {
    return null
  }
}

export function useAuth() {
  const isAuthenticated = (): boolean => {
    if (import.meta.server) return false
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return false
    const exp = parseJwtExp(token)
    if (exp === null || exp < Math.floor(Date.now() / 1000)) {
      logout()
      return false
    }
    return true
  }

  const getCurrentUser = async (): Promise<User | null> => {
    if (import.meta.server) return null
    if (!isAuthenticated()) return null
    try {
      return await apiFetch<User>('/api/auth/me')
    } catch {
      logout()
      return null
    }
  }

  const register = async (email: string, password: string): Promise<User> => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Email inválido')
    }
    if (!password || password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres')
    }

    const res = await $fetch<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: { email, password }
    })
    localStorage.setItem(TOKEN_KEY, res.token)
    localStorage.setItem(USER_EMAIL_KEY, res.user.email)
    useAccentColor().applyAccentFromUser(res.user)
    return res.user
  }

  const login = async (email: string, password: string): Promise<User> => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Email inválido')
    }
    if (!password) {
      throw new Error('La contraseña es requerida')
    }

    const res = await $fetch<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    })
    localStorage.setItem(TOKEN_KEY, res.token)
    localStorage.setItem(USER_EMAIL_KEY, res.user.email)
    useAccentColor().applyAccentFromUser(res.user)
    return res.user
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_EMAIL_KEY)
    useAccentColor().clearAccentOverrides()
  }

  const updateProfile = async (patch: UserProfilePatch): Promise<User> => {
    const user = await apiFetch<User>('/api/auth/me', {
      method: 'PATCH',
      body: patch
    })
    useAccentColor().applyAccentFromUser(user)
    return user
  }

  return {
    isAuthenticated,
    getCurrentUser,
    updateProfile,
    register,
    login,
    logout
  }
}
