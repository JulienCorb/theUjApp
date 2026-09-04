import { createFileRoute, redirect } from '@tanstack/react-router'
import { ensureAccessToken } from '#/lib/tuyau'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    throw redirect({ to: (await ensureAccessToken()) ? '/dashboard' : '/login' })
  },
})