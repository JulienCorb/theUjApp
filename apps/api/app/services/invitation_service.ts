import { createHmac, randomBytes } from 'node:crypto'

import { inject } from '@adonisjs/core'
import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'

import { hmacSecret, ttlDays } from '#config/invitation'
import Invitation from '#models/invitation'
import User from '#models/user'
import AuthService from '#services/auth_service'
import MailService from '#services/mail_service'
import UserService from '#services/user_service'

const INVITATION_TOKEN_BYTES = 48

export type IssuedInvitationToken = {
  token: string
  expiresAt: DateTime
}

/**
 * Business logic around invitations: inviting users by email and consuming
 * the invitation token to activate the account (set password + auto-login).
 *
 * User mutations, account creation and email delivery are delegated to
 * UserService, AuthService and MailService. The service stays free of HTTP
 * concerns (no HttpContext) so it can be reused by CLI commands and tests.
 */
@inject()
export default class InvitationService {
  constructor(
    protected authService: AuthService,
    protected mailService: MailService,
    protected userService: UserService
  ) {}

  /**
   * Invites the email to create an account: creates the user in an invited
   * state (no password) and sends a single-use invitation link by mail.
   *
   * Re-inviting an invited email issues a fresh token and invalidates any
   * outstanding one (link rotation).
   *
   * @throws {@link Exception} E_USER_ALREADY_ACTIVE when an active account
   * already exists for the email
   */
  async invite(email: string, role: 'client'): Promise<IssuedInvitationToken & { user: User }> {
    const user = await this.userService.findOrCreateInvited(email, role)

    const { token, expiresAt } = await this.issue(user.id)

    await this.mailService.sendInvitationEmail(user, token, expiresAt)

    return { user, token, expiresAt }
  }

  /**
   * Returns the invitation for the given token when it is still usable
   * (exists, not consumed and not expired), otherwise null.
   */
  async findActive(token: string) {
    const tokenHash = this.hashToken(token)

    return Invitation.query()
      .where('token_hash', tokenHash)
      .whereNull('consumed_at')
      .where('expires_at', '>', DateTime.now().toSQL())
      .first()
  }

  /**
   * Consumes the given invitation token, sets the user's password and issues
   * an access + refresh token pair (auto-login).
   *
   * @throws {@link Exception} E_INVALID_INVITATION when the token is unknown,
   * already consumed or expired
   */
  async accept(
    token: string,
    password: string
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const tokenHash = this.hashToken(token)

    const user = await db.transaction(async (client) => {
      const current = await Invitation.query({ client })
        .where('token_hash', tokenHash)
        .forUpdate()
        .first()
      const now = DateTime.now()

      if (!current || current.consumedAt || current.expiresAt.toMillis() <= now.toMillis()) {
        throw new Exception('Invalid or expired invitation link', {
          status: 400,
          code: 'E_INVALID_INVITATION',
        })
      }

      const invitedUser = await User.query({ client }).where('id', current.userId).first()
      if (!invitedUser) {
        throw new Exception('Invalid or expired invitation link', {
          status: 400,
          code: 'E_INVALID_INVITATION',
        })
      }

      invitedUser.useTransaction(client)
      await this.authService.changePassword(invitedUser, password)

      current.useTransaction(client)
      current.consumedAt = now
      await current.save()

      await this.consumeActiveForUser(invitedUser.id, client, now)

      return invitedUser
    })

    return this.authService.issueTokenPair(user)
  }

  /**
   * Creates an invitation token for the user, invalidating any outstanding
   * ones.
   */
  private async issue(userId: string): Promise<IssuedInvitationToken> {
    const now = DateTime.now()
    const expiresAt = now.plus({ days: ttlDays })
    const token = randomBytes(INVITATION_TOKEN_BYTES).toString('base64url')

    await db.transaction(async (client) => {
      await this.consumeActiveForUser(userId, client, now)
      await Invitation.create(
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
   * Marks every outstanding invitation of the user as consumed.
   */
  private async consumeActiveForUser(
    userId: string,
    client: TransactionClientContract,
    consumedAt: DateTime = DateTime.now()
  ): Promise<void> {
    await Invitation.query({ client })
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
