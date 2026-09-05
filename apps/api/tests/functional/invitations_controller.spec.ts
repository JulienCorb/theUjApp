import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import limiter from '@adonisjs/limiter/services/main'
import mail from '@adonisjs/mail/services/main'
import database from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

import InvitationNotification from '#mails/invitation_notification'
import Invitation from '#models/invitation'
import User from '#models/user'
import { assertRequiresAuth } from '#tests/helpers/auth'
import { InvitationTestFactory } from '#tests/factories/invitation_test_factory'
import { UserTestFactory } from '#tests/factories/user_test_factory'

test.group('InvitationsController store (create invitation)', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(async () => {
    await limiter.clear()
  })

  test('creating an invitation requires auth (401 without token)', async ({ client }) => {
    await assertRequiresAuth(client, 'invitations.invitations.store', {
      body: { email: 'anonymous@example.com' },
    })
  })

  test('returns 403 when a client user tries to create an invitation', async ({ client }) => {
    const { accessToken } = await UserTestFactory.createWithTokens({ email: 'client@example.com' })

    const response = await client
      .visit('invitations.invitations.store')
      .bearerToken(accessToken)
      .json({ email: 'victim@example.com' })
      .send()

    response.assertStatus(403)
  })

  test('internal user creates an invitation and the invited user is created', async ({
    client,
    db,
    assert,
  }) => {
    const { mails } = mail.fake()
    const { accessToken } = await UserTestFactory.createWithTokens({
      email: 'admin@example.com',
      role: 'internal',
    })

    const response = await client
      .visit('invitations.invitations.store')
      .bearerToken(accessToken)
      .json({ email: 'invitee@example.com' })
      .send()

    response.assertStatus(201)
    assert.deepEqual(response.body(), {})

    mails.assertSentCount(InvitationNotification, 1)
    const notification = mails.sent()[0] as InvitationNotification
    assert.isAtLeast(notification.getInvitationToken().length, 32)

    const user = await User.findByOrFail('email', 'invitee@example.com')
    assert.equal(user.role, 'client')
    assert.isNull(user.password)
    await db.assertHas('invitations', { user_id: user.id, consumed_at: null })
  })

  test('internal user creates an invitation with an optional phone number', async ({
    client,
    db,
  }) => {
    mail.fake()
    const { accessToken } = await UserTestFactory.createWithTokens({
      email: 'admin-phone@example.com',
      role: 'internal',
    })

    const response = await client
      .visit('invitations.invitations.store')
      .bearerToken(accessToken)
      .json({ email: 'phone@example.com', icc: '33', localPhoneNumber: '612345678' })
      .send()

    response.assertStatus(201)

    const user = await User.findByOrFail('email', 'phone@example.com')
    await db.assertHas('invitations', {
      user_id: user.id,
      icc: '33',
      local_phone_number: '612345678',
    })
  })

  test('creating an invitation without a phone number stores nulls', async ({ client, db }) => {
    mail.fake()
    const { accessToken } = await UserTestFactory.createWithTokens({
      email: 'admin-nophone@example.com',
      role: 'internal',
    })

    const response = await client
      .visit('invitations.invitations.store')
      .bearerToken(accessToken)
      .json({ email: 'nophone@example.com' })
      .send()

    response.assertStatus(201)

    const user = await User.findByOrFail('email', 'nophone@example.com')
    await db.assertHas('invitations', { user_id: user.id, icc: null, local_phone_number: null })
  })

  test('re-inviting an invited email rotates the invitation link', async ({ client, assert }) => {
    const { mails } = mail.fake()
    const { accessToken } = await UserTestFactory.createWithTokens({
      email: 'admin-rotate@example.com',
      role: 'internal',
    })

    await client
      .visit('invitations.invitations.store')
      .bearerToken(accessToken)
      .json({ email: 'rotate@example.com' })
      .send()
    const first = (mails.sent()[0] as InvitationNotification).getInvitationToken()

    await client
      .visit('invitations.invitations.store')
      .bearerToken(accessToken)
      .json({ email: 'rotate@example.com' })
      .send()
    const second = (mails.sent()[1] as InvitationNotification).getInvitationToken()
    assert.notEqual(second, first)

    const user = await User.findByOrFail('email', 'rotate@example.com')
    assert.isNull(user.password)
    const active = await database
      .from('invitations')
      .where('user_id', user.id)
      .whereNull('consumed_at')
      .count('*')
      .first()
    assert.equal(Number(active!.count), 1)
  })

  test('returns 409 when the email already has an active account', async ({ client }) => {
    const { accessToken } = await UserTestFactory.createWithTokens({
      email: 'admin-conflict@example.com',
      role: 'internal',
    })
    await UserTestFactory.create({ email: 'active@example.com' })

    const response = await client
      .visit('invitations.invitations.store')
      .bearerToken(accessToken)
      .json({ email: 'active@example.com' })
      .send()

    response.assertStatus(409)
  })

  test('validation: invalid email returns 422', async ({ client }) => {
    const { accessToken } = await UserTestFactory.createWithTokens({
      email: 'admin-validation@example.com',
      role: 'internal',
    })

    const response = await client
      .visit('invitations.invitations.store')
      .bearerToken(accessToken)
      .json({ email: 'not-an-email' })
      .send()

    response.assertStatus(422)
  })

  test('validation: icc longer than 3 digits returns 422', async ({ client }) => {
    const { accessToken } = await UserTestFactory.createWithTokens({
      email: 'admin-icc-long@example.com',
      role: 'internal',
    })

    const response = await client
      .visit('invitations.invitations.store')
      .bearerToken(accessToken)
      .json({ email: 'icc-long@example.com', icc: '1234' })
      .send()

    response.assertStatus(422)
  })

  test('validation: non-digit icc returns 422', async ({ client }) => {
    const { accessToken } = await UserTestFactory.createWithTokens({
      email: 'admin-icc-alpha@example.com',
      role: 'internal',
    })

    const response = await client
      .visit('invitations.invitations.store')
      .bearerToken(accessToken)
      .json({ email: 'icc-alpha@example.com', icc: 'ab' })
      .send()

    response.assertStatus(422)
  })

  test('validation: non-digit local phone number returns 422', async ({ client }) => {
    const { accessToken } = await UserTestFactory.createWithTokens({
      email: 'admin-phone-alpha@example.com',
      role: 'internal',
    })

    const response = await client
      .visit('invitations.invitations.store')
      .bearerToken(accessToken)
      .json({ email: 'phone-alpha@example.com', localPhoneNumber: '12-345' })
      .send()

    response.assertStatus(422)
  })

  test('validation: local phone number longer than 15 digits returns 422', async ({ client }) => {
    const { accessToken } = await UserTestFactory.createWithTokens({
      email: 'admin-phone-long@example.com',
      role: 'internal',
    })

    const response = await client
      .visit('invitations.invitations.store')
      .bearerToken(accessToken)
      .json({ email: 'phone-long@example.com', localPhoneNumber: '1'.repeat(16) })
      .send()

    response.assertStatus(422)
  })

  test('creating invitations is rate-limited', async ({ client, assert }) => {
    const { accessToken } = await UserTestFactory.createWithTokens({
      email: 'admin-ratelimit@example.com',
      role: 'internal',
    })

    for (let i = 0; i < 20; i++) {
      const response = await client
        .visit('invitations.invitations.store')
        .bearerToken(accessToken)
        .json({ email: `ratelimit-${i}@example.com` })
        .send()

      response.assertStatus(201)
    }

    const response = await client
      .visit('invitations.invitations.store')
      .bearerToken(accessToken)
      .json({ email: 'ratelimit-over@example.com' })
      .send()

    response.assertStatus(429)
    assert.equal((response.body() as any).errors[0].message, 'Too many requests')
  })
})

test.group('InvitationsController accept', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(async () => {
    await limiter.clear()
  })

  test('accepts a valid invitation, sets the password and auto-logs in', async ({
    client,
    db,
    assert,
  }) => {
    mail.fake()
    const { user, token: inviteToken } = await InvitationTestFactory.create({
      email: 'accept@example.com',
    })

    const response = await client
      .visit('auth.invitations.accept')
      .json({
        token: inviteToken,
        password: 'NewPassword123!',
        passwordConfirmation: 'NewPassword123!',
        icc: '33',
        localPhoneNumber: '0612345678',
      })
      .send()

    response.assertStatus(200)
    response.assertBodyContains({
      data: {
        message: 'Account created successfully.',
        user: {
          email: 'accept@example.com',
          phoneNumber: '+33612345678',
          role: 'client',
        },
      },
    })
    assert.isString((response.body() as any).data.accessToken)
    assert.isNotEmpty((response.body() as any).data.accessToken)

    const refreshCookie = response.cookie('refresh_token')
    assert.isDefined(refreshCookie)
    assert.isTrue(refreshCookie!.httpOnly)
    assert.isNotEmpty(refreshCookie!.value)

    const refreshed = await User.findOrFail(user.id)
    assert.isNotNull(refreshed.password)
    assert.equal(refreshed.phoneNumber, '+33612345678')
    await db.assertHas('users', { phone_number: '+33612345678' })

    const invitation = await Invitation.query().where('user_id', user.id).firstOrFail()
    assert.isNotNull(invitation.consumedAt)
    await db.assertHas('auth_access_tokens', { tokenable_id: user.id }, 2)

    const login = await client
      .visit('auth.access_tokens.store')
      .json({ email: 'accept@example.com', password: 'NewPassword123!' })
      .send()
    login.assertStatus(200)
  })

  test('accepting with a phone number already in use returns 409', async ({ client }) => {
    mail.fake()
    await InvitationTestFactory.createAccepted({ email: 'taken@example.com' })
    const { token } = await InvitationTestFactory.create({ email: 'phone-taken@example.com' })

    const response = await client
      .visit('auth.invitations.accept')
      .json({
        token,
        password: 'NewPassword123!',
        passwordConfirmation: 'NewPassword123!',
        icc: '33',
        localPhoneNumber: '612345678',
      })
      .send()

    response.assertStatus(409)
  })

  test('token is single-use: replaying it returns 400', async ({ client }) => {
    mail.fake()
    const { token } = await InvitationTestFactory.create({ email: 'replay@example.com' })

    const payload = {
      token,
      password: 'NewPassword123!',
      passwordConfirmation: 'NewPassword123!',
      icc: '33',
      localPhoneNumber: '612345678',
    }
    const first = await client.visit('auth.invitations.accept').json(payload).send()
    first.assertStatus(200)

    const replay = await client
      .visit('auth.invitations.accept')
      .json({
        ...payload,
        password: 'AnotherPassword123!',
        passwordConfirmation: 'AnotherPassword123!',
      })
      .send()
    replay.assertStatus(400)
  })

  test('unknown or garbage token returns 400', async ({ client }) => {
    const response = await client
      .visit('auth.invitations.accept')
      .json({
        token: 'x'.repeat(64),
        password: 'NewPassword123!',
        passwordConfirmation: 'NewPassword123!',
        icc: '33',
        localPhoneNumber: '612345678',
      })
      .send()

    response.assertStatus(400)
  })

  test('expired token returns 400', async ({ client }) => {
    mail.fake()
    const { user, token } = await InvitationTestFactory.create({ email: 'expired@example.com' })

    const invitation = await Invitation.query().where('user_id', user.id).firstOrFail()
    invitation.expiresAt = DateTime.now().minus({ days: 1 })
    await invitation.save()

    const response = await client
      .visit('auth.invitations.accept')
      .json({
        token,
        password: 'NewPassword123!',
        passwordConfirmation: 'NewPassword123!',
        icc: '33',
        localPhoneNumber: '612345678',
      })
      .send()

    response.assertStatus(400)
  })

  test('validation: short token returns 422', async ({ client }) => {
    const response = await client
      .visit('auth.invitations.accept')
      .json({
        token: 'short',
        password: 'NewPassword123!',
        passwordConfirmation: 'NewPassword123!',
        icc: '33',
        localPhoneNumber: '612345678',
      })
      .send()

    response.assertStatus(422)
  })

  test('validation: password below policy returns 422', async ({ client }) => {
    const response = await client
      .visit('auth.invitations.accept')
      .json({
        token: 'x'.repeat(64),
        password: 'short',
        passwordConfirmation: 'short',
        icc: '33',
        localPhoneNumber: '612345678',
      })
      .send()

    response.assertStatus(422)
  })

  test('validation: password confirmation mismatch returns 422', async ({ client }) => {
    const response = await client
      .visit('auth.invitations.accept')
      .json({
        token: 'x'.repeat(64),
        password: 'NewPassword123!',
        passwordConfirmation: 'DifferentPassword123!',
        icc: '33',
        localPhoneNumber: '612345678',
      })
      .send()

    response.assertStatus(422)
  })

  test('validation: missing icc returns 422', async ({ client }) => {
    const response = await client
      .visit('auth.invitations.accept')
      .json({
        token: 'x'.repeat(64),
        password: 'NewPassword123!',
        passwordConfirmation: 'NewPassword123!',
        localPhoneNumber: '612345678',
      } as any)
      .send()

    response.assertStatus(422)
  })

  test('validation: missing local phone number returns 422', async ({ client }) => {
    const response = await client
      .visit('auth.invitations.accept')
      .json({
        token: 'x'.repeat(64),
        password: 'NewPassword123!',
        passwordConfirmation: 'NewPassword123!',
        icc: '33',
      } as any)
      .send()

    response.assertStatus(422)
  })

  test('validation: icc longer than 3 digits returns 422', async ({ client }) => {
    const response = await client
      .visit('auth.invitations.accept')
      .json({
        token: 'x'.repeat(64),
        password: 'NewPassword123!',
        passwordConfirmation: 'NewPassword123!',
        icc: '1234',
        localPhoneNumber: '612345678',
      })
      .send()

    response.assertStatus(422)
  })

  test('validation: non-digit icc returns 422', async ({ client }) => {
    const response = await client
      .visit('auth.invitations.accept')
      .json({
        token: 'x'.repeat(64),
        password: 'NewPassword123!',
        passwordConfirmation: 'NewPassword123!',
        icc: 'ab',
        localPhoneNumber: '612345678',
      })
      .send()

    response.assertStatus(422)
  })

  test('validation: non-digit local phone number returns 422', async ({ client }) => {
    const response = await client
      .visit('auth.invitations.accept')
      .json({
        token: 'x'.repeat(64),
        password: 'NewPassword123!',
        passwordConfirmation: 'NewPassword123!',
        icc: '33',
        localPhoneNumber: '12-345',
      })
      .send()

    response.assertStatus(422)
  })

  test('validation: local phone number longer than 15 digits returns 422', async ({ client }) => {
    const response = await client
      .visit('auth.invitations.accept')
      .json({
        token: 'x'.repeat(64),
        password: 'NewPassword123!',
        passwordConfirmation: 'NewPassword123!',
        icc: '33',
        localPhoneNumber: '1'.repeat(16),
      })
      .send()

    response.assertStatus(422)
  })

  test('accepting an invitation is rate-limited', async ({ client, assert }) => {
    const payload = {
      token: 'x'.repeat(64),
      password: 'NewPassword123!',
      passwordConfirmation: 'NewPassword123!',
      icc: '33',
      localPhoneNumber: '612345678',
    }

    for (let i = 0; i < 10; i++) {
      const response = await client.visit('auth.invitations.accept').json(payload).send()

      response.assertStatus(400)
    }

    const response = await client.visit('auth.invitations.accept').json(payload).send()

    response.assertStatus(429)
    assert.equal(
      (response.body() as any).errors[0].message,
      'Too many invitation accept attempts. Please try again later.'
    )
  })
})

test.group('InvitationsController show (fetch invitation by token)', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(async () => {
    await limiter.clear()
  })

  test('returns the invitation for a fresh token', async ({ client, assert }) => {
    mail.fake()
    const { token } = await InvitationTestFactory.create({ email: 'show@example.com' })

    const response = await client.visit('auth.invitations.show', { token }).send()

    response.assertStatus(200)
    const body = response.body() as any
    assert.isString(body.data.invitation.id)
    assert.isNotEmpty(body.data.invitation.id)
    assert.isOk(body.data.invitation.expiresAt)
  })

  test('returns the phone number for an invitation created with one', async ({ client }) => {
    mail.fake()
    const { token } = await InvitationTestFactory.create({
      email: 'show-phone@example.com',
      icc: '33',
      localPhoneNumber: '612345678',
    })

    const response = await client.visit('auth.invitations.show', { token }).send()

    response.assertStatus(200)
    response.assertBodyContains({
      data: {
        invitation: {
          icc: '33',
          localPhoneNumber: '612345678',
        },
      },
    })
  })

  test('returns null phone fields for an invitation created without one', async ({ client }) => {
    mail.fake()
    const { token } = await InvitationTestFactory.create({ email: 'show-nophone@example.com' })

    const response = await client.visit('auth.invitations.show', { token }).send()

    response.assertStatus(200)
    response.assertBodyContains({
      data: {
        invitation: {
          icc: null,
          localPhoneNumber: null,
        },
      },
    })
  })

  test('returns 404 for an unknown token', async ({ client }) => {
    const response = await client.visit('auth.invitations.show', { token: 'x'.repeat(64) }).send()

    response.assertStatus(404)
  })

  test('returns 404 after the invitation was accepted', async ({ client }) => {
    mail.fake()
    const { token } = await InvitationTestFactory.create({ email: 'used-show@example.com' })

    const accept = await client
      .visit('auth.invitations.accept')
      .json({
        token,
        password: 'NewPassword123!',
        passwordConfirmation: 'NewPassword123!',
        icc: '33',
        localPhoneNumber: '612345678',
      })
      .send()
    accept.assertStatus(200)

    const response = await client.visit('auth.invitations.show', { token }).send()

    response.assertStatus(404)
  })

  test('returns 404 for an expired invitation', async ({ client }) => {
    mail.fake()
    const { user, token } = await InvitationTestFactory.create({
      email: 'expired-show@example.com',
    })

    const invitation = await Invitation.query().where('user_id', user.id).firstOrFail()
    invitation.expiresAt = DateTime.now().minus({ days: 1 })
    await invitation.save()

    const response = await client.visit('auth.invitations.show', { token }).send()

    response.assertStatus(404)
  })

  test('validation: short token returns 422', async ({ client }) => {
    const response = await client.visit('auth.invitations.show', { token: 'short' }).send()

    response.assertStatus(422)
  })
})
