import vine from '@vinejs/vine'

/**
 * Shared rules for email and password.
 */
const email = () => vine.string().email().maxLength(254)
const password = () => vine.string().minLength(8).maxLength(32)

/**
 * Max length accepted for a password attempt at login.
 *
 * Must be large enough to never reject a legitimate password (signup caps
 * attempts at 32 chars) but small enough that hashing an attempt stays cheap.
 * Without this bound, an attacker can send arbitrarily large password strings,
 * forcing the server to hash megabytes of input on every request (DoS vector).
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
