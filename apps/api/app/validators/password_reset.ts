import vine from '@vinejs/vine'

import { email, password } from '#validators/user'

/**
 * Min/max length accepted for a password reset token.
 *
 * Tokens are 48 random bytes encoded as base64url (64 chars). The min length
 * guards against empty/short values, the max length keeps hashing cheap (DoS
 * guard, mirroring `MAX_LOGIN_PASSWORD_LENGTH`).
 */
export const MIN_RESET_TOKEN_LENGTH = 32
export const MAX_RESET_TOKEN_LENGTH = 256

/**
 * Validator to use when requesting a password reset link.
 */
export const requestPasswordResetValidator = vine.create({
  email: email(),
})

/**
 * Validator to use when consuming a password reset token.
 */
export const resetPasswordValidator = vine.create({
  token: vine.string().trim().minLength(MIN_RESET_TOKEN_LENGTH).maxLength(MAX_RESET_TOKEN_LENGTH),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
})
