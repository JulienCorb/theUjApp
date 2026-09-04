import { test } from '@japa/runner'
import logger from '@adonisjs/core/services/logger'
import testUtils from '@adonisjs/core/services/test_utils'
import mail from '@adonisjs/mail/services/main'
import { DateTime } from 'luxon'

import InvitationNotification from '#mails/invitation_notification'
import PasswordResetNotification from '#mails/password_reset_notification'
import MailService from '#services/mail_service'
import { UserTestFactory } from '#tests/factories/user_test_factory'

const mailService = new MailService()

test.group('MailService', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('sendPasswordResetEmail delivers the reset notification', async ({ assert }) => {
    const { mails } = mail.fake()
    const user = await UserTestFactory.create({ email: 'mail@example.com' })

    await mailService.sendPasswordResetEmail(
      user,
      'raw-token',
      DateTime.now().plus({ minutes: 60 })
    )

    mails.assertSentCount(PasswordResetNotification, 1)
    const notification = mails.sent()[0] as PasswordResetNotification
    assert.equal(notification.getResetToken(), 'raw-token')
  })

  test('sendPasswordResetEmail does not throw when delivery fails', async ({ assert }) => {
    mail.fake()
    const user = await UserTestFactory.create({ email: 'mail-fail@example.com' })

    const originalSend = mail.send.bind(mail)
    mail.send = async () => {
      throw new Error('smtp down')
    }
    const originalError = logger.error
    logger.error = () => {}

    try {
      await assert.doesNotReject(() =>
        mailService.sendPasswordResetEmail(user, 'raw-token', DateTime.now().plus({ minutes: 60 }))
      )
    } finally {
      mail.send = originalSend
      logger.error = originalError
    }
  })

  test('sendInvitationEmail delivers the invitation notification', async ({ assert }) => {
    const { mails } = mail.fake()
    const user = await UserTestFactory.create({ email: 'mail-invite@example.com' })

    await mailService.sendInvitationEmail(
      user,
      'raw-invite-token',
      DateTime.now().plus({ days: 7 })
    )

    mails.assertSentCount(InvitationNotification, 1)
    const notification = mails.sent()[0] as InvitationNotification
    assert.equal(notification.getInvitationToken(), 'raw-invite-token')
  })

  test('sendInvitationEmail does not throw when delivery fails', async ({ assert }) => {
    mail.fake()
    const user = await UserTestFactory.create({ email: 'mail-invite-fail@example.com' })

    const originalSend = mail.send.bind(mail)
    mail.send = async () => {
      throw new Error('smtp down')
    }
    const originalError = logger.error
    logger.error = () => {}

    try {
      await assert.doesNotReject(() =>
        mailService.sendInvitationEmail(user, 'raw-invite-token', DateTime.now().plus({ days: 7 }))
      )
    } finally {
      mail.send = originalSend
      logger.error = originalError
    }
  })
})
