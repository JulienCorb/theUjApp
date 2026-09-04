import { Exception } from '@adonisjs/core/exceptions'

import User, { type UserRole } from '#models/user'

/**
 * Business logic around user accounts: creation of active accounts used by
 * bootstrapping paths (seeders, test factories) and creation of invited
 * accounts (no password yet) used by the invitation flow.
 *
 * The service stays free of HTTP concerns (no HttpContext) so it can be
 * reused by CLI commands and tests.
 */
export default class UserService {
  /**
   * Creates an active user account with the given credentials and role.
   */
  async createActiveUser(email: string, password: string, role: UserRole) {
    const normalizedEmail = email.trim().toLowerCase()
    const user = await User.create({ email: normalizedEmail, password, role })

    return user
  }

  /**
   * Returns the invited user matching the email, creating it without a
   * password when it does not exist yet.
   *
   * @throws {@link Exception} E_USER_ALREADY_ACTIVE when an active account
   * already exists for the email
   */
  async findOrCreateInvited(email: string, role: 'client') {
    const normalizedEmail = email.trim().toLowerCase()
    const user = await User.firstOrCreate({ email: normalizedEmail }, { role })

    if (user.password) {
      throw new Exception('A user account already exists for this email', {
        status: 409,
        code: 'E_USER_ALREADY_ACTIVE',
      })
    }

    return user
  }
}
