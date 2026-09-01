import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'

import { useSignup } from '#/hooks/auth'
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

export const Route = createFileRoute('/signup')({ component: Signup })

function Signup() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')

  const signup = useSignup()

  const error = signup.error
  const validationErrors =
    error !== null && error.isValidationError() ? error.response.errors : []
  const isRateLimited = error !== null && error.status === 429
  const otherError =
    error !== null && !error.isValidationError() && !isRateLimited
      ? error.message
      : null

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (signup.isPending) return
    signup.mutate(
      { body: { email, password, passwordConfirmation } },
      {
        onSuccess: () => navigate({ to: '/dashboard' }),
      },
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <Card className="w-full sm:max-w-md">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Enter your details below to sign up</CardDescription>
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
                  <FieldError>Too many requests. Try again later.</FieldError>
                </Field>
              )}
              <Field data-invalid={hasFieldError(validationErrors, 'email')}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
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
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                />
                <FieldDescription>
                  Between 8 and 32 characters.
                </FieldDescription>
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
                  Confirm password
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
                    errors={errorsFor(validationErrors, 'passwordConfirmation')}
                  />
                )}
              </Field>
              <Field>
                <Button type="submit" disabled={signup.isPending}>
                  {signup.isPending ? 'Creating account…' : 'Sign up'}
                </Button>
                <FieldDescription className="text-center">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    Login
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
