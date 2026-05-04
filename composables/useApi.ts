export function authFetchHeaders(): HeadersInit {
  if (!import.meta.client) {
    return {}
  }
  const token = localStorage.getItem('postly_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

type ApiOpts = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
}

export function apiFetch<T>(url: string, opts: ApiOpts = {}) {
  return $fetch<T>(url, {
    method: opts.method,
    body: opts.body,
    headers: {
      ...authFetchHeaders(),
      ...opts.headers
    }
  })
}
