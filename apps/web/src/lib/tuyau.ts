// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../api/config/auth.ts" />

import { createTuyau } from '@tuyau/core/client'
import { createTuyauReactQueryClient } from '@tuyau/react-query'
import { registry } from '@theuj/api/registry'
import { getToken } from '#/lib/auth-store'

export const client = createTuyau({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3333',
  registry,
  headers: { Accept: 'application/json' },
  hooks: {
    beforeRequest: [
      (request) => {
        const token = getToken()
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`)
        }
      },
    ],
  },
})

export const api = createTuyauReactQueryClient({ client })

export const urlFor = client.urlFor
