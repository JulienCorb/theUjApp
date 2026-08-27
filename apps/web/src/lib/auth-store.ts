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

// TODO(auth): upgrade to robust auth system
// - Add token refresh logic (access token + refresh token flow)
// - Persist token in secure httpOnly cookie or sessionStorage with encryption
// - Add role/permission checks via Bouncer integration
// - Handle token expiry gracefully (auto-refresh before expiry)
// - Add logout everywhere / revoke all sessions