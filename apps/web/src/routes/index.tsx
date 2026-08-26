import { createFileRoute, redirect } from '@tanstack/react-router'
import { getToken } from '#/lib/auth-store'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: getToken() ? '/dashboard' : '/login' })
  },
})
