import { createHmac } from 'node:crypto'

import { test } from '@japa/runner'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import mail from '@adonisjs/mail/services/main'
import { DateTime } from 'luxon'

import { hmacSecret } from '#config/invitation'
import type InvitationNotification from '#mails/invitation_notification'
import Invitation from '#models/invitation'
import User from '#models/user'
import AuthService from '#services/auth_service'
import InvitationService from '#services/invitation_service'
import MailService from '#services/mail_service'
import UserService from '#services/user_service'
import { InvitationTestFactory } from '#tests/factories/invitation_test_factory'
import { UserTestFactory } from '#tests/factories/user_test_factory'

const invitationService = new InvitationService(
  new AuthService(),
  new MailService(),
  new UserService()
)

test.group('InvitationService', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('invite creates an invited user and stores the HMAC hash of the token', async ({
    assert,
  }) => {
    const { mails } = mail.fake()

    const { user, token, expiresAt } = await invitationService.invite(
      'invite@example.com',
      'client'
    )

    assert.equal(user.email, 'invite@example.com')
    assert.equal(user.role, 'client')

    const refreshed = await User.findOrFail(user.id)
    assert.isNull(refreshed.password)
    assert.isNotEmpty(token)
    assert.isOk(expiresAt)

    const invitation = await Invitation.query().where('user_id', user.id).firstOrFail()
    assert.lengthOf(invitation.tokenHash, 64)
    assert.match(invitation.tokenHash, /^[a-f0-9]{64}$/)

    const notification = mails.sent()[0] as InvitationNotification
    assert.isDefined(notification)
    assert.notEqual(invitation.tokenHash, notification.getInvitationToken())
  })

  test('invite stores a deterministic HMAC of the raw token', async ({ assert }) => {
    const { mails } = mail.fake()

    await invitationService.invite('hmac@example.com', 'client')

    const notification = mails.sent()[0] as InvitationNotification
    const rawToken = notification.getInvitationToken()
    const expectedHash = createHmac('sha256', hmacSecret).update(rawToken).digest('hex')

    const user = await User.findByOrFail('email', 'hmac@example.com')
    const invitation = await Invitation.query().where('user_id', user.id).firstOrFail()
    assert.equal(invitation.tokenHash, expectedHash)
  })

  test('invite normalizes the email (trim + lowercase)', async ({ assert }) => {
    mail.fake()

    const { user } = await invitationService.invite('  Invite@Example.COM  ', 'client')

    assert.equal(user.email, 'invite@example.com')
  })

  test('re-inviting an invited email rotates the token', async ({ assert }) => {
    const { mails } = mail.fake()

    await invitationService.invite('rotate@example.com', 'client')
    const first = (mails.sent()[0] as InvitationNotification).getInvitationToken()

    await invitationService.invite('rotate@example.com', 'client')
    const second = (mails.sent()[1] as InvitationNotification).getInvitationToken()
    assert.notEqual(second, first)

    const user = await User.findByOrFail('email', 'rotate@example.com')
    assert.isNull(user.password)
    const consumed = (await db
      .from('invitations')
      .where('user_id', user.id)
      .whereNotNull('consumed_at')
      .count('*')
      .first())!
    assert.equal(Number(consumed.count), 1)
    const active = (await db
      .from('invitations')
      .where('user_id', user.id)
      .whereNull('consumed_at')
      .count('*')
      .first())!
    assert.equal(Number(active.count), 1)
  })

  test('invite rejects an email that already has an active account', async ({ assert }) => {
    mail.fake()
    await UserTestFactory.create({ email: 'active@example.com' })

    await assert.rejects(
      () => invitationService.invite('active@example.com', 'client'),
      'A user account already exists for this email'
    )
  })

  test('accept sets the password, consumes the invitation and issues a token pair', async ({
    assert,
  }) => {
    mail.fake()
    const { user, token: rawToken } = await InvitationTestFactory.create({
      email: 'accept@example.com',
    })

    const { accessToken, refreshToken } = await invitationService.accept(
      rawToken,
      'NewPassword123!'
    )

    const refreshed = await User.findOrFail(user.id)
    assert.isTrue(await hash.verify(refreshed.password!, 'NewPassword123!'))

    const invitation = await Invitation.query().where('user_id', user.id).firstOrFail()
    assert.isNotNull(invitation.consumedAt)

    assert.isString(accessToken)
    assert.isNotEmpty(accessToken)
    assert.isString(refreshToken)
    assert.isNotEmpty(refreshToken)
    const tokens = await User.accessTokens.all(user)
    assert.equal(tokens.length, 1)
    const refreshTokens = await User.refreshTokens.all(user)
    assert.equal(refreshTokens.length, 1)
  })

  test('accept rejects a consumed token', async ({ assert }) => {
    mail.fake()
    const { token: rawToken } = await InvitationTestFactory.createAccepted({
      email: 'consumed@example.com',
    })

    await assert.rejects(
      () => invitationService.accept(rawToken, 'AnotherPassword123!'),
      'Invalid or expired invitation link'
    )
  })

  test('accept rejects an expired token', async ({ assert }) => {
    mail.fake()
    const { user, token: rawToken } = await InvitationTestFactory.create({
      email: 'expired@example.com',
    })

    const invitation = await Invitation.query().where('user_id', user.id).firstOrFail()
    invitation.expiresAt = DateTime.now().minus({ days: 1 })
    await invitation.save()

    await assert.rejects(
      () => invitationService.accept(rawToken, 'NewPassword123!'),
      'Invalid or expired invitation link'
    )
  })

  test('accept rejects an unknown token', async ({ assert }) => {
    mail.fake()

    await assert.rejects(
      () => invitationService.accept('x'.repeat(64), 'NewPassword123!'),
      'Invalid or expired invitation link'
    )
  })

  test('findActive returns the invitation for a fresh token', async ({ assert }) => {
    mail.fake()
    const { token: rawToken } = await InvitationTestFactory.create({
      email: 'find-active@example.com',
    })

    const result = await invitationService.findActive(rawToken)

    assert.isNotNull(result)
    assert.isOk(result!.expiresAt)
  })

  test('findActive returns null for unknown, consumed and expired tokens', async ({ assert }) => {
    mail.fake()

    const unknown = await invitationService.findActive('x'.repeat(64))
    assert.isNull(unknown)

    const { token: consumedToken } = await InvitationTestFactory.createAccepted({
      email: 'find-active-invalid@example.com',
    })
    const consumed = await invitationService.findActive(consumedToken)
    assert.isNull(consumed)

    const { user: expiredUser, token: expiredToken } = await InvitationTestFactory.create({
      email: 'find-active-expired@example.com',
    })
    const invitation = await Invitation.query().where('user_id', expiredUser.id).firstOrFail()
    invitation.expiresAt = DateTime.now().minus({ days: 1 })
    await invitation.save()

    const expired = await invitationService.findActive(expiredToken)
    assert.isNull(expired)
  })
})
