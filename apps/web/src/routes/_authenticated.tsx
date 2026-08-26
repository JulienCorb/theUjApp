import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { getToken } from '#/lib/auth-store'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    if (!getToken()) {
      throw redirect({ to: '/login' })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return <Outlet />
}
