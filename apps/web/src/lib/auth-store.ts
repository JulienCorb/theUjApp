let token: string | null = null

/**
 * In-memory access token store. The token lives only in memory (never
 * localStorage/sessionStorage) — an XSS can steal it, but it expires in
 * 15 minutes and dies on page reload. The long-lived refresh token is held
 * by the browser in an httpOnly cookie and never touches JavaScript.
 */
export function getToken() {
  return token
}

export function setToken(value: string) {
  token = value
}

export function clearToken() {
  token = null
}