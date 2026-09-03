import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import mail from '@adonisjs/mail/services/main'
import { DateTime } from 'luxon'

import PasswordResetNotification from '#mails/password_reset_notification'
import MailService from '#services/mail_service'
import { UserTestFactory } from '#tests/factories/user_test_factory'

const mailService = new MailService()

test.group('MailService', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.teardown(() => mail.restore())

  test('sendPasswordResetEmail delivers the reset notification', async ({ assert }) => {
    mail.restore()
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
    mail.restore()
    mail.fake()
    const user = await UserTestFactory.create({ email: 'mail-fail@example.com' })

    const originalSend = mail.send.bind(mail)
    mail.send = async () => {
      throw new Error('smtp down')
    }

    try {
      await assert.doesNotReject(() =>
        mailService.sendPasswordResetEmail(user, 'raw-token', DateTime.now().plus({ minutes: 60 }))
      )
    } finally {
      mail.send = originalSend
    }
  })
})
