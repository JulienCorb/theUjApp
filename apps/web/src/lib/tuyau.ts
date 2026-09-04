import { createTuyau } from '@tuyau/core/client'
import { createTuyauReactQueryClient } from '@tuyau/react-query'
import { registry } from '@theuj/api/registry'
import { clearToken, getToken, setToken } from '#/lib/auth-store'

const AUTH_ROUTE_SUFFIXES = ['/auth/login', '/auth/refresh']

export const client = createTuyau({
  baseUrl: import.meta.env.DEV ? '' : import.meta.env.VITE_API_URL,
  registry,
  credentials: 'include',
  headers: { Accept: 'application/json' },
  retry: {
    limit: 1,
    statusCodes: [401],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'TRACE'],
  },
  hooks: {
    beforeRequest: [
      (request) => {
        const token = getToken()
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`)
        }
      },
    ],
    beforeRetry: [
      async ({ request }) => {
        if (AUTH_ROUTE_SUFFIXES.some((suffix) => request.url.endsWith(suffix))) return
        await refreshAccessToken()
      },
    ],
  },
})

export const api = createTuyauReactQueryClient({ client })

export const urlFor = client.urlFor

let refreshPromise: Promise<string | null> | null = null

/**
 * Refreshes the access token using the httpOnly refresh cookie. Single
 * flight: concurrent 401s share the same in-flight refresh. Returns the new
 * token, or null when the refresh failed (user must re-authenticate).
 */
export async function refreshAccessToken(): Promise<string | null> {
  refreshPromise ??= doRefresh()
  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

async function doRefresh(): Promise<string | null> {
  try {
    const { data } = await client.api.auth.refreshTokens.store({ retry: { limit: 0 } })
    setToken(data.accessToken)
    return data.accessToken
  } catch {
    clearToken()
    return null
  }
}

/**
 * Returns the cached access token, or refreshes once when it is missing
 * (e.g. after a hard page reload). Used by route guards.
 */
export async function ensureAccessToken(): Promise<string | null> {
  if (getToken()) return getToken()
  return refreshAccessToken()
}