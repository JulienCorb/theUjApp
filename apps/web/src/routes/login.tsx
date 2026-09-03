import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'

import { m } from '#/paraglide/messages.js'
import { useLogin } from '#/hooks/auth'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field'

type FieldErrors = Array<{ field?: string; message: string } | undefined>

function errorsFor(errors: FieldErrors, field: string) {
  return errors.filter((error) => error?.field === field)
}

function hasFieldError(errors: FieldErrors, field: string) {
  return errors.some((error) => error?.field === field)
}

export const Route = createFileRoute('/login')({ component: Login })

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const login = useLogin()

  const error = login.error
  const validationErrors =
    error !== null && error.isValidationError() ? error.response.errors : []
  const isRateLimited = error !== null && error.status === 429
  const otherError =
    error !== null && !error.isValidationError() && !isRateLimited
      ? error.message
      : null

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (login.isPending) return
    login.mutate(
      { body: { email, password } },
      {
        onSuccess: () => navigate({ to: '/dashboard' }),
      },
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <Card className="w-full sm:max-w-md">
        <CardHeader>
          <CardTitle>{m.login_title()}</CardTitle>
          <CardDescription>{m.login_subtitle()}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {otherError && (
                <Field aria-invalid>
                  <FieldError>{otherError}</FieldError>
                </Field>
              )}
              {isRateLimited && (
                <Field aria-invalid>
                  <FieldError>{m.error_too_many_requests()}</FieldError>
                </Field>
              )}
              <Field data-invalid={hasFieldError(validationErrors, 'email')}>
                <FieldLabel htmlFor="email">{m.field_email()}</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
                {hasFieldError(validationErrors, 'email') && (
                  <FieldError errors={errorsFor(validationErrors, 'email')} />
                )}
              </Field>
              <Field data-invalid={hasFieldError(validationErrors, 'password')}>
                <FieldLabel htmlFor="password">{m.field_password()}</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
                {hasFieldError(validationErrors, 'password') && (
                  <FieldError
                    errors={errorsFor(validationErrors, 'password')}
                  />
                )}
              </Field>
              <Field>
                <Button type="submit" disabled={login.isPending}>
                  {login.isPending
                    ? m.login_submit_pending()
                    : m.login_submit()}
                </Button>
                <FieldDescription className="text-center">
                  {m.auth_signup_prompt()}{' '}
                  <Link
                    to="/signup"
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    {m.auth_signup_link()}
                  </Link>
                </FieldDescription>
                <FieldDescription className="text-center">
                  <Link
                    to="/forgot-password"
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    {m.auth_forgot_password_link()}
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
