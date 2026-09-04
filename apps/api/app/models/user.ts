import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import {
  accessTokenPrefix,
  accessTokenTtl,
  refreshTokenPrefix,
  refreshTokenTtl,
} from '#config/refresh_token'

/**
 * The roles a user account can have. Single source of truth for the role
 * values — mirrors the `users.role` text column.
 */
export const UserRole = { internal: 'internal', client: 'client' } as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  /**
   * Short-lived access tokens, sent as `Authorization: Bearer` on every
   * API call. The web app keeps them in memory only.
   */
  static accessTokens = DbAccessTokensProvider.forModel(User, {
    type: 'auth_token',
    prefix: accessTokenPrefix,
    expiresIn: accessTokenTtl,
  })

  /**
   * Long-lived refresh tokens, consumed by the refresh endpoint only and
   * rotated on every use. The web app stores them in an httpOnly cookie.
   */
  static refreshTokens = DbAccessTokensProvider.forModel(User, {
    type: 'refresh_token',
    prefix: refreshTokenPrefix,
    expiresIn: refreshTokenTtl,
  })

  declare currentAccessToken?: AccessToken
  declare role: UserRole
}
