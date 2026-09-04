import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import mail from '@adonisjs/mail/services/main'
import type { DateTime } from 'luxon'

import InvitationNotification from '#mails/invitation_notification'
import PasswordResetNotification from '#mails/password_reset_notification'
import type User from '#models/user'

/**
 * Sending of application emails.
 *
 * Delivery failures are logged but never thrown: an email that fails to send
 * must not break the request that triggered it. This service is the single
 * place where the delivery policy lives (and the future seam for queueing
 * emails instead of sending them synchronously — see AGENTS.md TODO(queue)).
 */
@inject()
export default class MailService {
  async sendPasswordResetEmail(user: User, token: string, expiresAt: DateTime): Promise<void> {
    try {
      await mail.send(new PasswordResetNotification(user, token, expiresAt))
    } catch (error) {
      logger.error({ error, userId: user.id }, 'Failed to deliver password reset email')
    }
  }

  async sendInvitationEmail(user: User, token: string, expiresAt: DateTime): Promise<void> {
    try {
      await mail.send(new InvitationNotification(user, token, expiresAt))
    } catch (error) {
      logger.error({ error, userId: user.id }, 'Failed to deliver invitation email')
    }
  }
}
