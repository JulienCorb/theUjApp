import { createHmac } from 'node:crypto'

import { test } from '@japa/runner'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import mail from '@adonisjs/mail/services/main'
import { DateTime } from 'luxon'

import { hmacSecret } from '#config/password_reset'
import type PasswordResetNotification from '#mails/password_reset_notification'
import PasswordResetToken from '#models/password_reset_token'
import User from '#models/user'
import AuthService from '#services/auth_service'
import MailService from '#services/mail_service'
import PasswordResetService from '#services/password_reset_service'
import { PasswordResetTestFactory } from '#tests/factories/password_reset_test_factory'
import { UserTestFactory } from '#tests/factories/user_test_factory'

const passwordResetService = new PasswordResetService(new AuthService(), new MailService())

test.group('PasswordResetService', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('requestReset issues a token and stores its HMAC hash', async ({ assert }) => {
    const { mails } = mail.fake()
    const user = await UserTestFactory.create({ email: 'issue@example.com' })

    await passwordResetService.requestReset('issue@example.com')

    const token = await PasswordResetToken.query().where('user_id', user.id).firstOrFail()
    assert.lengthOf(token.tokenHash, 64)
    assert.match(token.tokenHash, /^[a-f0-9]{64}$/)

    const notification = mails.sent()[0] as PasswordResetNotification
    assert.isDefined(notification)
    assert.notEqual(token.tokenHash, notification.getResetToken())
  })

  test('requestReset stores a deterministic HMAC of the raw token', async ({ assert }) => {
    const { mails } = mail.fake()
    const user = await UserTestFactory.create({ email: 'hmac@example.com' })

    await passwordResetService.requestReset('hmac@example.com')

    const notification = mails.sent()[0] as PasswordResetNotification
    const rawToken = notification.getResetToken()
    const expectedHash = createHmac('sha256', hmacSecret).update(rawToken).digest('hex')

    const token = await PasswordResetToken.query().where('user_id', user.id).firstOrFail()
    assert.equal(token.tokenHash, expectedHash)
  })

  test('requestReset is a no-op for unknown emails', async ({ assert }) => {
    const { mails } = mail.fake()

    await passwordResetService.requestReset('missing@example.com')

    assert.isEmpty(mails.sent())
    const { count } = (await db.from('password_reset_tokens').count('*').first())!
    assert.equal(Number(count), 0)
  })

  test('requestReset invalidates outstanding tokens for the user', async ({ assert }) => {
    mail.fake()
    const user = await UserTestFactory.create({ email: 'rotate@example.com' })

    await passwordResetService.requestReset('rotate@example.com')
    await passwordResetService.requestReset('rotate@example.com')

    const consumed = (await db
      .from('password_reset_tokens')
      .where('user_id', user.id)
      .whereNotNull('consumed_at')
      .count('*')
      .first())!
    assert.equal(Number(consumed.count), 1)

    const active = (await db
      .from('password_reset_tokens')
      .where('user_id', user.id)
      .whereNull('consumed_at')
      .count('*')
      .first())!
    assert.equal(Number(active.count), 1)
  })

  test('reset updates the password and marks the token consumed', async ({ assert }) => {
    const user = await UserTestFactory.create({
      email: 'reset@example.com',
      password: 'OldPassword123!',
    })
    const rawToken = await PasswordResetTestFactory.requestReset('reset@example.com')

    await passwordResetService.reset(rawToken, 'NewPassword123!')

    const refreshed = await User.findOrFail(user.id)
    assert.isTrue(await hash.verify(refreshed.password!, 'NewPassword123!'))
    assert.isFalse(await hash.verify(refreshed.password!, 'OldPassword123!'))

    const token = await PasswordResetToken.query().where('user_id', user.id).firstOrFail()
    assert.isNotNull(token.consumedAt)
  })

  test('reset rejects a consumed token', async ({ assert }) => {
    await UserTestFactory.create({ email: 'consumed@example.com' })
    const rawToken = await PasswordResetTestFactory.requestReset('consumed@example.com')

    await passwordResetService.reset(rawToken, 'NewPassword123!')

    await assert.rejects(
      () => passwordResetService.reset(rawToken, 'AnotherPassword123!'),
      'Invalid or expired password reset token'
    )
  })

  test('reset rejects an expired token', async ({ assert }) => {
    const user = await UserTestFactory.create({ email: 'expired@example.com' })
    const rawToken = await PasswordResetTestFactory.requestReset('expired@example.com')

    const token = await PasswordResetToken.query().where('user_id', user.id).firstOrFail()
    token.expiresAt = DateTime.now().minus({ minutes: 1 })
    await token.save()

    await assert.rejects(
      () => passwordResetService.reset(rawToken, 'NewPassword123!'),
      'Invalid or expired password reset token'
    )
  })

  test('reset rejects an unknown token', async ({ assert }) => {
    mail.fake()

    await assert.rejects(
      () => passwordResetService.reset('x'.repeat(64), 'NewPassword123!'),
      'Invalid or expired password reset token'
    )
  })

  test('reset revokes all access tokens of the user', async ({ assert }) => {
    const { user } = await UserTestFactory.createWithToken({ email: 'revoke@example.com' })
    const rawToken = await PasswordResetTestFactory.requestReset('revoke@example.com')

    const tokensBefore = await User.accessTokens.all(user)
    assert.equal(tokensBefore.length, 1)

    await passwordResetService.reset(rawToken, 'NewPassword123!')

    const tokensAfter = await User.accessTokens.all(user)
    assert.equal(tokensAfter.length, 0)
  })
})
