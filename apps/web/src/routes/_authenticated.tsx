import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { ensureAccessToken } from '#/lib/tuyau'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const token = await ensureAccessToken()
    if (!token) {
      throw redirect({ to: '/login' })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return <Outlet />
}