import vine from '@vinejs/vine'

import { password } from '#validators/user'

/**
 * Min/max length accepted for an invitation token.
 *
 * Tokens are 48 random bytes encoded as base64url (64 chars). The min length
 * guards against empty/short values, the max length keeps hashing cheap (DoS
 * guard, mirroring `MAX_LOGIN_PASSWORD_LENGTH`).
 */
export const MIN_INVITATION_TOKEN_LENGTH = 32
export const MAX_INVITATION_TOKEN_LENGTH = 256

/**
 * Validator to use when fetching an invitation by its token.
 */
export const showInvitationValidator = vine.create({
  params: vine.object({
    token: vine
      .string()
      .trim()
      .minLength(MIN_INVITATION_TOKEN_LENGTH)
      .maxLength(MAX_INVITATION_TOKEN_LENGTH),
  }),
})

/**
 * Validator to use when accepting an invitation.
 */
export const acceptInvitationValidator = vine.create({
  token: vine
    .string()
    .trim()
    .minLength(MIN_INVITATION_TOKEN_LENGTH)
    .maxLength(MAX_INVITATION_TOKEN_LENGTH),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
})
