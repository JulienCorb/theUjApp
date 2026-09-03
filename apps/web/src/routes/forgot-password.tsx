import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'

import { m } from '#/paraglide/messages.js'
import { useForgotPassword } from '#/hooks/auth'
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

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPassword,
})

function ForgotPassword() {
  const [email, setEmail] = useState('')

  const forgotPassword = useForgotPassword()

  const error = forgotPassword.error
  const validationErrors =
    error !== null && error.isValidationError() ? error.response.errors : []
  const isRateLimited = error !== null && error.status === 429
  const otherError =
    error !== null && !error.isValidationError() && !isRateLimited
      ? error.message
      : null

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (forgotPassword.isPending) return
    forgotPassword.mutate({ body: { email } })
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <Card className="w-full sm:max-w-md">
        <CardHeader>
          <CardTitle>{m.forgot_password_title()}</CardTitle>
          <CardDescription>{m.forgot_password_subtitle()}</CardDescription>
        </CardHeader>
        <CardContent>
          {forgotPassword.isSuccess ? (
            <Field>
              <FieldDescription>{m.forgot_password_success()}</FieldDescription>
              <Link
                to="/login"
                className="text-sm underline underline-offset-4 hover:text-primary"
              >
                {m.forgot_password_back_to_login()}
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
                <Field>
                  <Button type="submit" disabled={forgotPassword.isPending}>
                    {forgotPassword.isPending
                      ? m.forgot_password_submit_pending()
                      : m.forgot_password_submit()}
                  </Button>
                  <FieldDescription className="text-center">
                    <Link
                      to="/login"
                      className="underline underline-offset-4 hover:text-primary"
                    >
                      {m.forgot_password_back_to_login()}
                    </Link>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
