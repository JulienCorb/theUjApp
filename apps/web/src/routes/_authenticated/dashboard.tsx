import { createFileRoute, useNavigate } from '@tanstack/react-router'

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
  loader: ({ context }) => context.queryClient.ensureQueryData(profileQueryOptions()),
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
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>You are logged in.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {user && (
            <div className="flex flex-col gap-1 text-sm">
              <div>
                <span className="text-muted-foreground">Email: </span>
                {user.data.email}
              </div>
              {user.data.createdAt && (
                <div>
                  <span className="text-muted-foreground">Member since: </span>
                  {new Date(user.data.createdAt).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
          <Button
            variant="destructive"
            onClick={handleLogout}
            disabled={logout.isPending}
          >
            {logout.isPending ? 'Logging out…' : 'Logout'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
