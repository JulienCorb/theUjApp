import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'

/**
 * The roles a user account can have. Single source of truth for the role
 * values — mirrors the `users.role` text column.
 */
export const UserRole = { internal: 'internal', client: 'client' } as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  static accessTokens = DbAccessTokensProvider.forModel(User, {
    expiresIn: '7 days',
  })
  declare currentAccessToken?: AccessToken
  declare role: UserRole
}
