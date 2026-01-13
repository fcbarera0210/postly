// Utilidades para hashing y verificación usando Web Crypto API

// Funciones para PIN (mantenidas por compatibilidad temporal)
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  const pinHash = await hashPin(pin)
  return pinHash === hash
}

// Funciones para passwords con salt para mayor seguridad
async function generateSalt(): Promise<string> {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

async function hashWithSalt(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + salt)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Hashea una contraseña con salt aleatorio
 * Formato del hash: salt:hash (salt de 32 caracteres hex + hash de 64 caracteres hex)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await generateSalt()
  const hash = await hashWithSalt(password, salt)
  return `${salt}:${hash}`
}

/**
 * Verifica una contraseña contra un hash almacenado
 * El hash debe tener el formato: salt:hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':')
  if (!salt || !hash) {
    return false
  }
  const computedHash = await hashWithSalt(password, salt)
  return computedHash === hash
}
