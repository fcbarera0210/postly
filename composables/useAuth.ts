import { hashPassword, verifyPassword } from '~/utils/security'
import { createUser, getUserByEmail, getUserById } from '~/utils/db'
import { nanoid } from 'nanoid'

interface User {
  id: string
  email: string
}

const SESSION_KEY = 'postly_user_id'
const SESSION_EMAIL = 'postly_user_email'
const SESSION_TIMESTAMP = 'postly_timestamp'
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000 // 24 horas

export function useAuth() {
  const isAuthenticated = (): boolean => {
    if (import.meta.server) return false
    
    const userId = sessionStorage.getItem(SESSION_KEY)
    const timestamp = sessionStorage.getItem(SESSION_TIMESTAMP)
    
    if (!userId || !timestamp) return false
    
    // Sesión válida por 24 horas
    const sessionAge = Date.now() - parseInt(timestamp, 10)
    
    if (sessionAge > SESSION_MAX_AGE) {
      logout()
      return false
    }
    
    return true
  }

  const getCurrentUser = async (): Promise<User | null> => {
    if (import.meta.server) return null
    
    if (!isAuthenticated()) return null
    
    const userId = sessionStorage.getItem(SESSION_KEY)
    const email = sessionStorage.getItem(SESSION_EMAIL)
    
    if (!userId || !email) return null
    
    // Verificar que el usuario aún existe en la BD
    try {
      const user = await getUserById(userId)
      if (!user) {
        logout()
        return null
      }
      return { id: user.id, email: user.email }
    } catch (error) {
      logout()
      return null
    }
  }

  const register = async (email: string, password: string): Promise<User> => {
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Email inválido')
    }

    // Validar password
    if (!password || password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres')
    }

    // Verificar si el email ya existe
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      throw new Error('Este email ya está registrado')
    }

    // Hashear password
    const passwordHash = await hashPassword(password)

    // Crear usuario
    const userId = nanoid()
    const user = await createUser(userId, email, passwordHash)

    // Guardar sesión
    sessionStorage.setItem(SESSION_KEY, user.id)
    sessionStorage.setItem(SESSION_EMAIL, user.email)
    sessionStorage.setItem(SESSION_TIMESTAMP, Date.now().toString())

    return { id: user.id, email: user.email }
  }

  const login = async (email: string, password: string): Promise<User> => {
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Email inválido')
    }

    if (!password) {
      throw new Error('La contraseña es requerida')
    }

    // Buscar usuario por email
    const user = await getUserByEmail(email)
    if (!user) {
      throw new Error('Email o contraseña incorrectos')
    }

    // Verificar password
    const isValid = await verifyPassword(password, user.password_hash)
    if (!isValid) {
      throw new Error('Email o contraseña incorrectos')
    }

    // Guardar sesión
    sessionStorage.setItem(SESSION_KEY, user.id)
    sessionStorage.setItem(SESSION_EMAIL, user.email)
    sessionStorage.setItem(SESSION_TIMESTAMP, Date.now().toString())

    return { id: user.id, email: user.email }
  }

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(SESSION_EMAIL)
    sessionStorage.removeItem(SESSION_TIMESTAMP)
  }

  return {
    isAuthenticated,
    getCurrentUser,
    register,
    login,
    logout
  }
}
