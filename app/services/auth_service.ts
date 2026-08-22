import { type AccessToken } from '@adonisjs/auth/access_tokens'
import User from '#models/user'

/**
 * Business logic around authentication: account creation, credential
 * verification and token revocation.
 *
 * Controllers must delegate to this service instead of implementing
 * auth logic themselves. The service stays free of HTTP concerns
 * (no HttpContext) so it can be reused by CLI commands and tests.
 */
export default class AuthService {
  /**
   * Creates a new user account and issues an access token for it.
   */
  async register(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase()
    const user = await User.create({ email: normalizedEmail, password })
    const token = await User.accessTokens.create(user)

    return { user, token: token.value!.release() }
  }

  /**
   * Verifies the given credentials and issues a fresh access token.
   *
   * @throws {@link E_INVALID_CREDENTIALS} when the credentials are invalid
   */
  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase()
    const user = await User.verifyCredentials(normalizedEmail, password)
    const token = await User.accessTokens.create(user)

    return { user, token: token.value!.release() }
  }

  /**
   * Revokes the access token attached to the current session.
   */
  async logout(user: User, token: AccessToken) {
    await User.accessTokens.delete(user, token.identifier)
  }
}
