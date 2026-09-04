import { createHmac, randomBytes } from 'node:crypto'

import { inject } from '@adonisjs/core'
import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'

import { hmacSecret, ttlMinutes } from '#config/password_reset'
import User from '#models/user'
import PasswordResetToken from '#models/password_reset_token'
import AuthService from '#services/auth_service'
import MailService from '#services/mail_service'

const PASSWORD_RESET_TOKEN_BYTES = 48

export type IssuedPasswordResetToken = {
  token: string
  expiresAt: DateTime
}

/**
 * Business logic around password resets: issuing single-use reset tokens and
 * consuming them to change a user's password.
 *
 * User mutations and email delivery are delegated to AuthService and
 * MailService. The service stays free of HTTP concerns (no HttpContext) so it
 * can be reused by CLI commands and tests.
 */
@inject()
export default class PasswordResetService {
  constructor(
    protected authService: AuthService,
    protected mailService: MailService
  ) {}

  /**
   * Issues a single-use password reset token for the user matching the email
   * and sends it by mail.
   *
   * Deliberately does not reveal whether the email belongs to an account:
   * unknown emails are a no-op and the caller always responds the same way.
   */
  async requestReset(email: string): Promise<void> {
    const user = await User.findBy('email', email)
    if (!user) {
      return
    }

    const { token, expiresAt } = await this.issue(user.id)

    await this.mailService.sendPasswordResetEmail(user, token, expiresAt)
  }

  /**
   * Consumes the given reset token and updates the user's password.
   *
   * @throws {@link Exception} E_INVALID_PASSWORD_RESET_TOKEN when the token is
   * unknown, already consumed or expired
   */
  async reset(token: string, password: string): Promise<void> {
    const tokenHash = this.hashToken(token)

    await db.transaction(async (client) => {
      const current = await PasswordResetToken.query({ client })
        .where('token_hash', tokenHash)
        .forUpdate()
        .first()
      const now = DateTime.now()

      if (!current || current.consumedAt || current.expiresAt.toMillis() <= now.toMillis()) {
        throw new Exception('Invalid or expired password reset token', {
          status: 400,
          code: 'E_INVALID_PASSWORD_RESET_TOKEN',
        })
      }

      const user = await User.query({ client }).where('id', current.userId).first()
      if (!user) {
        throw new Exception('Invalid or expired password reset token', {
          status: 400,
          code: 'E_INVALID_PASSWORD_RESET_TOKEN',
        })
      }

      user.useTransaction(client)
      await this.authService.changePassword(user, password)

      current.useTransaction(client)
      current.consumedAt = now
      await current.save()

      await this.consumeActiveForUser(user.id, client, now)

      await this.authService.revokeAllTokens(user)
    })
  }

  /**
   * Creates a reset token for the user, invalidating any outstanding ones.
   *
   * Used by `requestReset` and by test fixtures (PasswordResetTestFactory)
   * to obtain a raw token without sending an email.
   */
  async issue(userId: string): Promise<IssuedPasswordResetToken> {
    const now = DateTime.now()
    const expiresAt = now.plus({ minutes: ttlMinutes })
    const token = randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString('base64url')

    await db.transaction(async (client) => {
      await this.consumeActiveForUser(userId, client, now)
      await PasswordResetToken.create(
        {
          userId,
          tokenHash: this.hashToken(token),
          expiresAt,
          consumedAt: null,
        },
        { client }
      )
    })

    return { token, expiresAt }
  }

  /**
   * Marks every outstanding token of the user as consumed.
   */
  private async consumeActiveForUser(
    userId: string,
    client: TransactionClientContract,
    consumedAt: DateTime = DateTime.now()
  ): Promise<void> {
    await PasswordResetToken.query({ client })
      .where('user_id', userId)
      .whereNull('consumed_at')
      .update({ consumed_at: consumedAt })
  }

  /**
   * Hashes a raw token with HMAC-SHA256 so the plain value is never stored.
   */
  private hashToken(token: string): string {
    return createHmac('sha256', hmacSecret).update(token).digest('hex')
  }
}
