import vine from '@vinejs/vine'

/**
 * Shared rules for email and password.
 */
export const email = () => vine.string().email().maxLength(254)
export const password = () =>
  vine.string().minLength(MIN_PASSWORD_LENGTH).maxLength(MAX_PASSWORD_LENGTH)

/**
 * Password policy bounds enforced wherever a password is chosen.
 */
export const MIN_PASSWORD_LENGTH = 12
export const MAX_PASSWORD_LENGTH = 32

/**
 * Max length accepted for a password attempt at login.
 *
 * Must be large enough to never reject a legitimate password (password
 * policy caps choices at `MAX_PASSWORD_LENGTH`) but small enough that hashing
 * an attempt stays cheap. Without this bound, an attacker can send
 * arbitrarily large password strings, forcing the server to hash megabytes of
 * input on every request (DoS vector).
 */
export const MAX_LOGIN_PASSWORD_LENGTH = 1024

/**
 * Validator to use before validating user credentials during login.
 */
export const loginValidator = vine.create({
  email: email(),
  password: vine.string().maxLength(MAX_LOGIN_PASSWORD_LENGTH),
})

/**
 * Validator to use when creating an invitation (inviting a client).
 *
 * Invitations always create client accounts — there is no role in the
 * payload. Add an enum-typed `role` field here when the admin interface
 * allows choosing roles.
 *
 * `icc` and `localPhoneNumber` are optional; there is no uniqueness
 * constraint on them.
 */
export const createUserValidator = vine.create({
  email: email(),
  icc: vine
    .string()
    .regex(/^\d{1,3}$/)
    .optional(),
  localPhoneNumber: vine.string().regex(/^\d+$/).maxLength(15).optional(),
})
