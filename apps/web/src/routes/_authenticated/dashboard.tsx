import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { m } from '#/paraglide/messages.js'
import { profileQueryOptions, useLogout, useProfile } from '#/hooks/auth'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'

export const Route = createFileRoute('/_authenticated/dashboard')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(profileQueryOptions()),
  component: Dashboard,
})

function Dashboard() {
  const navigate = useNavigate()
  const { data: user } = useProfile()
  const logout = useLogout()

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => navigate({ to: '/login' }),
    })
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <Card className="w-full sm:max-w-md">
        <CardHeader>
          <CardTitle>{m.dashboard_title()}</CardTitle>
          <CardDescription>{m.dashboard_logged_in()}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {user && (
            <div className="flex flex-col gap-1 text-sm">
              <div>
                <span className="text-muted-foreground">
                  {m.dashboard_email()}
                </span>
                {user.data.email}
              </div>
              {user.data.createdAt && (
                <div>
                  <span className="text-muted-foreground">
                    {m.dashboard_member_since()}
                  </span>
                  {new Date(user.data.createdAt).toLocaleDateString('fr-FR')}
                </div>
              )}
            </div>
          )}
          <Button
            variant="destructive"
            onClick={handleLogout}
            disabled={logout.isPending}
          >
            {logout.isPending ? m.logout_submit_pending() : m.logout_submit()}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
