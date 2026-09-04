import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import limiter from '@adonisjs/limiter/services/main'
import mail from '@adonisjs/mail/services/main'
import User from '#models/user'
import { InvitationTestFactory } from '#tests/factories/invitation_test_factory'
import { UserTestFactory } from '#tests/factories/user_test_factory'
import { MAX_LOGIN_PASSWORD_LENGTH } from '#validators/user'

test.group('AccessTokensController store (login)', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(async () => {
    await limiter.clear()
  })

  test('login succeeds with correct credentials and sets the refresh cookie', async ({
    client,
    db,
    assert,
  }) => {
    await UserTestFactory.create({
      email: 'login@example.com',
      password: 'Password123!',
    })

    const response = await client
      .visit('auth.access_tokens.store')
      .json({
        email: 'login@example.com',
        password: 'Password123!',
      })
      .send()

    response.assertStatus(200)
    response.assertBodyContains({
      data: {
        user: {
          email: 'login@example.com',
        },
        accessToken: response.body().data.accessToken,
      },
    })
    assert.isString(response.body().data.accessToken)
    assert.isNotEmpty(response.body().data.accessToken)
    assert.isUndefined((response.body().data as any).refreshToken)

    const refreshCookie = response.cookie('refresh_token')
    assert.isDefined(refreshCookie)
    assert.isTrue(refreshCookie!.httpOnly)
    assert.isNotEmpty(refreshCookie!.value)

    const setCookies = response.header('set-cookie') as string | string[]
    const rawSetCookie = (
      Array.isArray(setCookies)
        ? setCookies.find((header) => header.startsWith('refresh_token='))
        : setCookies
    )!
    const rawRefreshToken = rawSetCookie.split(';')[0]!.split('=').slice(1).join('=')
    assert.isFalse(rawRefreshToken.startsWith('s%3A'), 'refresh cookie must be plain, not signed')
    assert.isFalse(
      rawRefreshToken.startsWith('e%3A'),
      'refresh cookie must be plain, not encrypted'
    )

    const user = await User.findByOrFail('email', 'login@example.com')
    await db.assertHas('auth_access_tokens', { tokenable_id: user.id }, 2)
  })

  test('login normalizes email', async ({ client }) => {
    await UserTestFactory.create({
      email: 'normalizelogin@example.com',
      password: 'Password123!',
    })

    const response = await client
      .visit('auth.access_tokens.store')
      .json({
        email: '  NORMALIZELOGIN@example.com  ',
        password: 'Password123!',
      })
      .send()

    response.assertStatus(200)
    response.assertBodyContains({
      data: {
        user: {
          email: 'normalizelogin@example.com',
        },
      },
    })
  })

  test('login fails with wrong password', async ({ client }) => {
    await UserTestFactory.createWithTokens({
      email: 'wrongpw@example.com',
      password: 'Password123!',
    })

    const response = await client
      .visit('auth.access_tokens.store')
      .json({
        email: 'wrongpw@example.com',
        password: 'WrongPassword!',
      })
      .send()

    response.assertStatus(400)
  })

  test('login fails with unknown email', async ({ client }) => {
    const response = await client
      .visit('auth.access_tokens.store')
      .json({
        email: 'nonexistent@example.com',
        password: 'Password123!',
      })
      .send()

    response.assertStatus(400)
  })

  test('login fails for an invited user that has not accepted yet', async ({ client, db }) => {
    mail.fake()
    await InvitationTestFactory.create({ email: 'invited-login@example.com' })

    const response = await client
      .visit('auth.access_tokens.store')
      .json({
        email: 'invited-login@example.com',
        password: 'Password123!',
      })
      .send()

    response.assertStatus(400)
    await db.assertEmpty('auth_access_tokens')
  })

  test('login validation: missing email returns 422', async ({ client }) => {
    const response = await client
      .visit('auth.access_tokens.store')
      .json({
        password: 'Password123!',
      } as any)
      .send()

    response.assertStatus(422)
  })

  test('login validation: missing password returns 422', async ({ client }) => {
    const response = await client
      .visit('auth.access_tokens.store')
      .json({
        email: 'missingpw@example.com',
      } as any)
      .send()

    response.assertStatus(422)
  })

  test('login validation: invalid email format returns 422', async ({ client }) => {
    const response = await client
      .visit('auth.access_tokens.store')
      .json({
        email: 'not-an-email',
        password: 'Password123!',
      })
      .send()

    response.assertStatus(422)
  })

  test('login rejects excessively long password (DoS prevention)', async ({ client }) => {
    const response = await client
      .visit('auth.access_tokens.store')
      .json({
        email: 'longpw@example.com',
        password: 'x'.repeat(MAX_LOGIN_PASSWORD_LENGTH + 1),
      })
      .send()

    response.assertStatus(422)
  })

  test('login is rate-limited', async ({ client, assert }) => {
    for (let i = 0; i < 30; i++) {
      const response = await client
        .visit('auth.access_tokens.store')
        .json({
          email: 'ratelimit@example.com',
          password: 'WrongPassword!',
        })
        .send()

      response.assertStatus(400)
    }

    const response = await client
      .visit('auth.access_tokens.store')
      .json({
        email: 'ratelimit@example.com',
        password: 'WrongPassword!',
      })
      .send()

    response.assertStatus(429)
    assert.equal((response.body() as any).errors[0].message, 'Too many requests')
    assert.isNumber((response.body() as any).errors[0].retryAfter)
  })
})

test.group('AccessTokensController destroy (logout)', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('logout requires auth (401 without token)', async ({ client }) => {
    const response = await client.visit('profile.access_tokens.destroy').send()

    response.assertStatus(401)
  })

  test('logout revokes the access and refresh tokens and clears the cookie', async ({
    client,
    db,
    assert,
  }) => {
    const { user, accessToken, refreshToken } = await UserTestFactory.createWithTokens({
      email: 'logout@example.com',
      password: 'Password123!',
    })

    const response = await client
      .visit('profile.access_tokens.destroy')
      .bearerToken(accessToken)
      .withPlainCookie('refresh_token', refreshToken)
      .send()

    response.assertStatus(200)

    const subsequentResponse = await client
      .visit('profile.profile.show')
      .bearerToken(accessToken)
      .send()

    subsequentResponse.assertStatus(401)

    await db.assertMissing('auth_access_tokens', { tokenable_id: user.id })

    const clearedCookie = response.cookie('refresh_token')
    assert.isDefined(clearedCookie)
    assert.isDefined(clearedCookie!.expires)
  })

  test('logout without a refresh cookie still revokes the access token', async ({ client, db }) => {
    const { user, accessToken } = await UserTestFactory.createWithTokens({
      email: 'logout-no-cookie@example.com',
      password: 'Password123!',
    })

    const response = await client
      .visit('profile.access_tokens.destroy')
      .bearerToken(accessToken)
      .send()

    response.assertStatus(200)

    await db.assertMissing('auth_access_tokens', { tokenable_id: user.id, type: 'auth_token' })
  })

  test('logout response is wrapped in data key', async ({ client, assert }) => {
    const { accessToken } = await UserTestFactory.createWithTokens({
      email: 'serialize@example.com',
      password: 'Password123!',
    })

    const response = await client
      .visit('profile.access_tokens.destroy')
      .bearerToken(accessToken)
      .send()

    response.assertStatus(200)
    assert.isDefined((response.body() as any).data)
  })

  // TODO: uncomment after adding resource-scoped endpoints + policies (start/routes.ts:35)
  test('returns 403 when bouncer denies access to resource', async () => {}).skip()
})
