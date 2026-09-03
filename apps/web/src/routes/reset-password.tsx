import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'

import { m } from '#/paraglide/messages.js'
import { useResetPassword } from '#/hooks/auth'
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

export const Route = createFileRoute('/reset-password')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : '',
  }),
  component: ResetPassword,
})

function ResetPassword() {
  const { token } = Route.useSearch()
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')

  const resetPassword = useResetPassword()

  const error = resetPassword.error
  const validationErrors =
    error !== null && error.isValidationError() ? error.response.errors : []
  const isRateLimited = error !== null && error.status === 429
  const otherError =
    error !== null && !error.isValidationError() && !isRateLimited
      ? error.message
      : null

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (resetPassword.isPending) return
    resetPassword.mutate({ body: { token, password, passwordConfirmation } })
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <Card className="w-full sm:max-w-md">
        <CardHeader>
          <CardTitle>{m.reset_password_title()}</CardTitle>
          <CardDescription>{m.reset_password_subtitle()}</CardDescription>
        </CardHeader>
        <CardContent>
          {token === '' ? (
            <Field aria-invalid>
              <FieldError>{m.reset_password_invalid_token()}</FieldError>
              <Link
                to="/forgot-password"
                className="text-sm underline underline-offset-4 hover:text-primary"
              >
                {m.forgot_password_submit()}
              </Link>
            </Field>
          ) : resetPassword.isSuccess ? (
            <Field>
              <FieldDescription>{m.reset_password_success()}</FieldDescription>
              <Link
                to="/login"
                className="text-sm underline underline-offset-4 hover:text-primary"
              >
                {m.reset_password_back_to_login()}
              </Link>
            </Field>
          ) : (
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
                <Field
                  data-invalid={hasFieldError(validationErrors, 'password')}
                >
                  <FieldLabel htmlFor="password">
                    {m.field_password()}
                  </FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  {hasFieldError(validationErrors, 'password') && (
                    <FieldError
                      errors={errorsFor(validationErrors, 'password')}
                    />
                  )}
                </Field>
                <Field
                  data-invalid={hasFieldError(
                    validationErrors,
                    'passwordConfirmation',
                  )}
                >
                  <FieldLabel htmlFor="passwordConfirmation">
                    {m.field_password_confirmation()}
                  </FieldLabel>
                  <Input
                    id="passwordConfirmation"
                    type="password"
                    value={passwordConfirmation}
                    onChange={(event) =>
                      setPasswordConfirmation(event.target.value)
                    }
                    autoComplete="new-password"
                    required
                  />
                  {hasFieldError(validationErrors, 'passwordConfirmation') && (
                    <FieldError
                      errors={errorsFor(
                        validationErrors,
                        'passwordConfirmation',
                      )}
                    />
                  )}
                </Field>
                <Field>
                  <Button type="submit" disabled={resetPassword.isPending}>
                    {resetPassword.isPending
                      ? m.reset_password_submit_pending()
                      : m.reset_password_submit()}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
