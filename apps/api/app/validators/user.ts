import vine from '@vinejs/vine'

/**
 * Shared rules for email and password.
 */
export const email = () => vine.string().email().maxLength(254)
export const password = () =>
  vine.string().minLength(MIN_SIGNUP_PASSWORD_LENGTH).maxLength(MAX_SIGNUP_PASSWORD_LENGTH)

/**
 * Password policy bounds enforced at signup.
 */
export const MIN_SIGNUP_PASSWORD_LENGTH = 12
export const MAX_SIGNUP_PASSWORD_LENGTH = 32

/**
 * Max length accepted for a password attempt at login.
 *
 * Must be large enough to never reject a legitimate password (signup caps
 * attempts at `MAX_SIGNUP_PASSWORD_LENGTH`) but small enough that hashing an
 * attempt stays cheap. Without this bound, an attacker can send arbitrarily
 * large password strings, forcing the server to hash megabytes of input on
 * every request (DoS vector).
 */
export const MAX_LOGIN_PASSWORD_LENGTH = 1024

/**
 * Validator to use when performing self-signup
 */
export const signupValidator = vine.create({
  email: email().unique({ table: 'users', column: 'email' }),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
})

/**
 * Validator to use before validating user credentials
 * during login
 */
export const loginValidator = vine.create({
  email: email(),
  password: vine.string().maxLength(MAX_LOGIN_PASSWORD_LENGTH),
})
