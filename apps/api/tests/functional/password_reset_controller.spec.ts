import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import limiter from '@adonisjs/limiter/services/main'
import mail from '@adonisjs/mail/services/main'

import PasswordResetNotification from '#mails/password_reset_notification'
import PasswordResetToken from '#models/password_reset_token'
import User from '#models/user'
import { UserTestFactory } from '#tests/factories/user_test_factory'

test.group('PasswordResetController forgot (request reset)', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(async () => {
    await limiter.clear()
  })

  test('issues a reset token and sends a reset email', async ({ client, db, assert }) => {
    const { mails } = mail.fake()
    await UserTestFactory.create({ email: 'forgot@example.com' })

    const response = await client
      .visit('auth.password_reset.forgot')
      .json({ email: 'forgot@example.com' })
      .send()

    response.assertStatus(202)
    response.assertBodyContains({
      data: {
        message: 'If an account exists for that email, a password reset link has been sent.',
      },
    })

    mails.assertSentCount(PasswordResetNotification, 1)
    const notification = mails.sent()[0] as PasswordResetNotification
    assert.isAtLeast(notification.getResetToken().length, 32)

    const user = await User.findByOrFail('email', 'forgot@example.com')
    await db.assertHas('password_reset_tokens', { user_id: user.id })
  })

  test('does not reveal whether an email exists', async ({ client }) => {
    const { mails } = mail.fake()

    const response = await client
      .visit('auth.password_reset.forgot')
      .json({ email: 'missing-account@example.com' })
      .send()

    response.assertStatus(202)
    response.assertBodyContains({
      data: {
        message: 'If an account exists for that email, a password reset link has been sent.',
      },
    })
    mails.assertSentCount(PasswordResetNotification, 0)
  })

  test('invalid email returns 422', async ({ client }) => {
    const response = await client
      .visit('auth.password_reset.forgot')
      .json({ email: 'not-an-email' })
      .send()

    response.assertStatus(422)
  })

  test('requesting a reset is rate-limited', async ({ client, assert }) => {
    for (let i = 0; i < 5; i++) {
      const response = await client
        .visit('auth.password_reset.forgot')
        .json({ email: 'ratelimit-forgot@example.com' })
        .send()

      response.assertStatus(202)
    }

    const response = await client
      .visit('auth.password_reset.forgot')
      .json({ email: 'ratelimit-forgot@example.com' })
      .send()

    response.assertStatus(429)
    assert.equal(
      (response.body() as any).errors[0].message,
      'Too many password reset requests. Please try again later.'
    )
  })
})

test.group('PasswordResetController reset (consume token)', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(async () => {
    await limiter.clear()
  })

  test('resets the password with a valid token', async ({ client, assert }) => {
    const { mails } = mail.fake()
    const user = await UserTestFactory.create({
      email: 'reset@example.com',
      password: 'Password123!',
    })

    await client.visit('auth.password_reset.forgot').json({ email: 'reset@example.com' }).send()
    const notification = mails.sent()[0] as PasswordResetNotification
    const rawToken = notification.getResetToken()

    const response = await client
      .visit('auth.password_reset.reset')
      .json({
        token: rawToken,
        password: 'NewPassword123!',
        passwordConfirmation: 'NewPassword123!',
      })
      .send()

    response.assertStatus(200)
    response.assertBodyContains({ data: { message: 'Password reset successfully.' } })

    const stored = await PasswordResetToken.query()
      .where('user_id', user.id)
      .whereNull('consumed_at')
      .first()
    assert.isNull(stored)

    const consumed = await PasswordResetToken.query()
      .where('user_id', user.id)
      .whereNotNull('consumed_at')
      .firstOrFail()
    assert.lengthOf(consumed.tokenHash, 64)
    assert.notEqual(consumed.tokenHash, rawToken)

    const oldLogin = await client
      .visit('auth.access_tokens.store')
      .json({ email: 'reset@example.com', password: 'Password123!' })
      .send()
    oldLogin.assertStatus(400)

    const newLogin = await client
      .visit('auth.access_tokens.store')
      .json({ email: 'reset@example.com', password: 'NewPassword123!' })
      .send()
    newLogin.assertStatus(200)
  })

  test('token is single-use: replaying it returns 400', async ({ client }) => {
    const { mails } = mail.fake()
    await UserTestFactory.create({ email: 'replay@example.com' })

    await client.visit('auth.password_reset.forgot').json({ email: 'replay@example.com' }).send()
    const rawToken = (mails.sent()[0] as PasswordResetNotification).getResetToken()

    const first = await client
      .visit('auth.password_reset.reset')
      .json({
        token: rawToken,
        password: 'NewPassword123!',
        passwordConfirmation: 'NewPassword123!',
      })
      .send()
    first.assertStatus(200)

    const replay = await client
      .visit('auth.password_reset.reset')
      .json({
        token: rawToken,
        password: 'AnotherPassword123!',
        passwordConfirmation: 'AnotherPassword123!',
      })
      .send()
    replay.assertStatus(400)
  })

  test('unknown or garbage token returns 400', async ({ client }) => {
    const response = await client
      .visit('auth.password_reset.reset')
      .json({
        token: 'x'.repeat(64),
        password: 'NewPassword123!',
        passwordConfirmation: 'NewPassword123!',
      })
      .send()

    response.assertStatus(400)
  })

  test('invalidates previous reset links when a new one is requested', async ({ client }) => {
    const { mails } = mail.fake()
    await UserTestFactory.create({ email: 'rotation@example.com' })

    await client.visit('auth.password_reset.forgot').json({ email: 'rotation@example.com' }).send()
    const first = (mails.sent()[0] as PasswordResetNotification).getResetToken()

    await client.visit('auth.password_reset.forgot').json({ email: 'rotation@example.com' }).send()
    const second = (mails.sent()[1] as PasswordResetNotification).getResetToken()

    const stale = await client
      .visit('auth.password_reset.reset')
      .json({
        token: first,
        password: 'NewPassword123!',
        passwordConfirmation: 'NewPassword123!',
      })
      .send()
    stale.assertStatus(400)

    const current = await client
      .visit('auth.password_reset.reset')
      .json({
        token: second,
        password: 'NewPassword123!',
        passwordConfirmation: 'NewPassword123!',
      })
      .send()
    current.assertStatus(200)
  })

  test('revokes all access tokens after a successful reset', async ({ client, db }) => {
    const { mails } = mail.fake()
    const { user, token } = await UserTestFactory.createWithToken({ email: 'revoke@example.com' })

    await client.visit('auth.password_reset.forgot').json({ email: 'revoke@example.com' }).send()
    const rawToken = (mails.sent()[0] as PasswordResetNotification).getResetToken()

    const response = await client
      .visit('auth.password_reset.reset')
      .json({
        token: rawToken,
        password: 'NewPassword123!',
        passwordConfirmation: 'NewPassword123!',
      })
      .send()
    response.assertStatus(200)

    await db.assertMissing('auth_access_tokens', { tokenable_id: user.id })

    const profileResponse = await client.visit('profile.profile.show').bearerToken(token).send()
    profileResponse.assertStatus(401)
  })

  test('validation: short token returns 422', async ({ client }) => {
    const response = await client
      .visit('auth.password_reset.reset')
      .json({
        token: 'short',
        password: 'NewPassword123!',
        passwordConfirmation: 'NewPassword123!',
      })
      .send()

    response.assertStatus(422)
  })

  test('validation: password below policy returns 422', async ({ client }) => {
    const response = await client
      .visit('auth.password_reset.reset')
      .json({
        token: 'x'.repeat(64),
        password: 'short',
        passwordConfirmation: 'short',
      })
      .send()

    response.assertStatus(422)
  })

  test('validation: password confirmation mismatch returns 422', async ({ client }) => {
    const response = await client
      .visit('auth.password_reset.reset')
      .json({
        token: 'x'.repeat(64),
        password: 'NewPassword123!',
        passwordConfirmation: 'DifferentPassword123!',
      })
      .send()

    response.assertStatus(422)
  })

  test('resetting a password is rate-limited', async ({ client, assert }) => {
    for (let i = 0; i < 10; i++) {
      const response = await client
        .visit('auth.password_reset.reset')
        .json({
          token: 'x'.repeat(64),
          password: 'NewPassword123!',
          passwordConfirmation: 'NewPassword123!',
        })
        .send()

      response.assertStatus(400)
    }

    const response = await client
      .visit('auth.password_reset.reset')
      .json({
        token: 'x'.repeat(64),
        password: 'NewPassword123!',
        passwordConfirmation: 'NewPassword123!',
      })
      .send()

    response.assertStatus(429)
    assert.equal(
      (response.body() as any).errors[0].message,
      'Too many password reset attempts. Please try again later.'
    )
  })
})
