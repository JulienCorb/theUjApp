let token: string | null = null

export function getToken() {
  return token
}

export function setToken(value: string) {
  token = value
}

export function clearToken() {
  token = null
}
