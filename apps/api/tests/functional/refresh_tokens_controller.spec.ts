import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import limiter from '@adonisjs/limiter/services/main'
import User from '#models/user'
import { UserTestFactory } from '#tests/factories/user_test_factory'

/**
 * Extracts the raw `refresh_token` value from the login response's Set-Cookie
 * header — exactly what a browser stores and replays (no normalization).
 */
function refreshTokenFromSetCookie(response: any): string {
  const setCookies = response.header('set-cookie') as string | string[]
  const setCookie = Array.isArray(setCookies)
    ? setCookies.find((header) => header.startsWith('refresh_token='))
    : setCookies
  if (!setCookie) {
    throw new Error('Login response did not set the refresh_token cookie')
  }
  return setCookie.split(';')[0]!.split('=').slice(1).join('=')
}

/**
 * Replays the raw cookie value exactly as a browser would: verbatim in the
 * Cookie header. The `cookie` macros are avoided on purpose — the plugin
 * re-signs/re-packs values, which would not match the stored wire format.
 */
function withRawRefreshCookie(value: string) {
  return `refresh_token=${value}`
}

async function loginViaApi(client: any, email: string, password: string) {
  const response = await client.visit('auth.access_tokens.store').json({ email, password }).send()
  response.assertStatus(200)
  const body = response.body().data
  return {
    user: await User.findByOrFail('email', email),
    accessToken: body.accessToken as string,
    refreshToken: refreshTokenFromSetCookie(response),
  }
}

test.group('RefreshTokensController store (refresh)', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(async () => {
    await limiter.clear()
  })

  test('refreshes with a valid refresh cookie and returns a new access token', async ({
    client,
    assert,
  }) => {
    await UserTestFactory.create({ email: 'refresh@example.com', password: 'Password123!' })
    const { accessToken, refreshToken } = await loginViaApi(
      client,
      'refresh@example.com',
      'Password123!'
    )

    const response = await client
      .visit('auth.refresh_tokens.store')
      .header('Cookie', withRawRefreshCookie(refreshToken))
      .send()

    response.assertStatus(200)
    const body = response.body().data
    assert.isString(body.accessToken)
    assert.isNotEmpty(body.accessToken)
    assert.notEqual(body.accessToken, accessToken)
    assert.isUndefined((body as any).refreshToken)

    const newRefreshToken = refreshTokenFromSetCookie(response)
    assert.isNotEmpty(newRefreshToken)
    assert.notEqual(newRefreshToken, refreshToken)

    const profile = await client.visit('profile.profile.show').bearerToken(body.accessToken).send()
    profile.assertStatus(200)
  })

  test('a rotated refresh token no longer works', async ({ client }) => {
    await UserTestFactory.create({ email: 'rotate@example.com', password: 'Password123!' })
    const { refreshToken } = await loginViaApi(client, 'rotate@example.com', 'Password123!')

    const first = await client
      .visit('auth.refresh_tokens.store')
      .header('Cookie', withRawRefreshCookie(refreshToken))
      .send()
    first.assertStatus(200)

    const replay = await client
      .visit('auth.refresh_tokens.store')
      .header('Cookie', withRawRefreshCookie(refreshToken))
      .send()
    replay.assertStatus(401)
  })

  test('returns 401 when no refresh cookie is present', async ({ client }) => {
    const response = await client.visit('auth.refresh_tokens.store').send()

    response.assertStatus(401)
  })

  test('returns 401 for a garbage refresh cookie', async ({ client }) => {
    const response = await client
      .visit('auth.refresh_tokens.store')
      .header('Cookie', withRawRefreshCookie('garbage-token-value'))
      .send()

    response.assertStatus(401)
  })

  test('replaying a rotated refresh token revokes every token of the user (reuse detection)', async ({
    client,
    db,
  }) => {
    await UserTestFactory.create({ email: 'reuse@example.com', password: 'Password123!' })
    const { user, refreshToken } = await loginViaApi(client, 'reuse@example.com', 'Password123!')

    const first = await client
      .visit('auth.refresh_tokens.store')
      .header('Cookie', withRawRefreshCookie(refreshToken))
      .send()
    first.assertStatus(200)

    const replay = await client
      .visit('auth.refresh_tokens.store')
      .header('Cookie', withRawRefreshCookie(refreshToken))
      .send()
    replay.assertStatus(401)

    await db.assertMissing('auth_access_tokens', { tokenable_id: user.id })
  })

  test('refreshing is rate-limited', async ({ client, assert }) => {
    for (let i = 0; i < 30; i++) {
      const response = await client
        .visit('auth.refresh_tokens.store')
        .header('Cookie', withRawRefreshCookie('x'.repeat(64)))
        .send()

      response.assertStatus(401)
    }

    const response = await client
      .visit('auth.refresh_tokens.store')
      .header('Cookie', withRawRefreshCookie('x'.repeat(64)))
      .send()

    response.assertStatus(429)
    assert.equal((response.body() as any).errors[0].message, 'Too many requests')
  })
})
