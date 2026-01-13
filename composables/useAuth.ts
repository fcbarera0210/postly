export function useAuth() {
  const isAuthenticated = () => {
    if (import.meta.server) return false
    
    const authenticated = sessionStorage.getItem('postly_authenticated')
    const timestamp = sessionStorage.getItem('postly_timestamp')
    
    if (!authenticated || !timestamp) return false
    
    // Sesión válida por 24 horas
    const sessionAge = Date.now() - parseInt(timestamp, 10)
    const maxAge = 24 * 60 * 60 * 1000 // 24 horas
    
    if (sessionAge > maxAge) {
      sessionStorage.removeItem('postly_authenticated')
      sessionStorage.removeItem('postly_timestamp')
      return false
    }
    
    return authenticated === 'true'
  }

  const logout = () => {
    sessionStorage.removeItem('postly_authenticated')
    sessionStorage.removeItem('postly_timestamp')
  }

  return {
    isAuthenticated,
    logout
  }
}
