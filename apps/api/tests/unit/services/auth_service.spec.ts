import { test } from '@japa/runner'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import mail from '@adonisjs/mail/services/main'
import AuthService from '#services/auth_service'
import User from '#models/user'
import InvalidRefreshTokenException from '#exceptions/invalid_refresh_token_exception'
import { InvitationTestFactory } from '#tests/factories/invitation_test_factory'
import { UserTestFactory } from '#tests/factories/user_test_factory'

test.group('AuthService', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('login rejects unknown email', async ({ assert }) => {
    const authService = new AuthService()

    assert.rejects(
      () => authService.login('nonexistent@example.com', 'Password123!'),
      'Invalid user credentials'
    )
  })

  test('login rejects wrong password', async ({ assert }) => {
    const authService = new AuthService()
    await UserTestFactory.create({ email: 'wrongpw@example.com', password: 'Password123!' })

    assert.rejects(
      () => authService.login('wrongpw@example.com', 'WrongPassword!'),
      'Invalid user credentials'
    )
  })

  test('login rejects an invited user that has not accepted yet', async ({ assert }) => {
    mail.fake()
    const authService = new AuthService()
    await InvitationTestFactory.create({ email: 'invited@example.com' })

    assert.rejects(
      () => authService.login('invited@example.com', 'Password123!'),
      'Invalid user credentials'
    )
  })

  test('login normalizes email before verifying credentials', async ({ assert }) => {
    const authService = new AuthService()
    await UserTestFactory.create({ email: 'normalize@example.com', password: 'Password123!' })

    const { user } = await authService.login('  NORMALIZE@example.com  ', 'Password123!')

    assert.equal(user.email, 'normalize@example.com')
  })

  test('login returns a non-empty access token and refresh token', async ({ assert }) => {
    const authService = new AuthService()
    await UserTestFactory.create({ email: 'login-token@example.com', password: 'Password123!' })

    const { accessToken, refreshToken } = await authService.login(
      'login-token@example.com',
      'Password123!'
    )

    assert.isString(accessToken)
    assert.isNotEmpty(accessToken)
    assert.isString(refreshToken)
    assert.isNotEmpty(refreshToken)
    assert.notEqual(accessToken, refreshToken)
  })

  test('login stores one access token and one refresh token', async ({ assert }) => {
    const authService = new AuthService()
    const user = await UserTestFactory.create({
      email: 'token-buckets@example.com',
      password: 'Password123!',
    })
    await authService.login('token-buckets@example.com', 'Password123!')

    const accessTokens = await User.accessTokens.all(user)
    const refreshTokens = await User.refreshTokens.all(user)
    assert.equal(accessTokens.length, 1)
    assert.equal(refreshTokens.length, 1)
  })

  test('access token expires after 15 minutes', async ({ assert }) => {
    const user = await UserTestFactory.create({
      email: 'expiry@example.com',
      password: 'Password123!',
    })
    await User.accessTokens.create(user)

    const tokens = await User.accessTokens.all(user)
    const dbToken = tokens[0]!

    assert.isOk(dbToken.expiresAt)

    const now = new Date()
    const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000)
    const diffMs = Math.abs(dbToken.expiresAt!.getTime() - fifteenMinutesLater.getTime())

    assert.isBelow(diffMs, 5 * 60 * 1000)
  })

  test('refresh token expires after 30 days', async ({ assert }) => {
    const user = await UserTestFactory.create({
      email: 'refresh-expiry@example.com',
      password: 'Password123!',
    })
    await User.refreshTokens.create(user)

    const tokens = await User.refreshTokens.all(user)
    const dbToken = tokens[0]!

    assert.isOk(dbToken.expiresAt)

    const now = new Date()
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const diffMs = Math.abs(dbToken.expiresAt!.getTime() - thirtyDaysLater.getTime())

    assert.isBelow(diffMs, 5 * 60 * 1000)
  })

  test('rotateRefreshToken issues a new pair and expires the old refresh token', async ({
    assert,
  }) => {
    const authService = new AuthService()
    const user = await UserTestFactory.create({
      email: 'rotate@example.com',
      password: 'Password123!',
    })
    const { refreshToken: oldRefreshToken } = await authService.login(
      'rotate@example.com',
      'Password123!'
    )

    const rotated = await authService.rotateRefreshToken(oldRefreshToken)

    assert.equal(rotated.user.id, user.id)
    assert.isNotEmpty(rotated.accessToken)
    assert.isNotEmpty(rotated.refreshToken)
    assert.notEqual(rotated.refreshToken, oldRefreshToken)

    const refreshTokens = await User.refreshTokens.all(user)
    assert.equal(refreshTokens.length, 2)

    const oldRow = await db
      .from('auth_access_tokens')
      .where('type', 'refresh_token')
      .orderBy('created_at', 'asc')
      .first()
    const now = Date.now()
    assert.isBelow(Math.abs(oldRow!.expires_at.getTime() - now), 5 * 60 * 1000)

    const rotatedRow = await db
      .from('auth_access_tokens')
      .where('type', 'refresh_token')
      .orderBy('created_at', 'desc')
      .first()
    const thirtyDaysLater = new Date(now + 30 * 24 * 60 * 60 * 1000)
    assert.isBelow(
      Math.abs(rotatedRow!.expires_at.getTime() - thirtyDaysLater.getTime()),
      5 * 60 * 1000
    )
  })

  test('rotateRefreshToken rejects garbage values', async ({ assert }) => {
    const authService = new AuthService()

    await assert.rejects(
      () => authService.rotateRefreshToken('garbage-token-value'),
      InvalidRefreshTokenException
    )
  })

  test('rotateRefreshToken rejects an access token used as a refresh token', async ({ assert }) => {
    const authService = new AuthService()
    const user = await UserTestFactory.create({
      email: 'wrong-type@example.com',
      password: 'Password123!',
    })
    const { accessToken } = await authService.login('wrong-type@example.com', 'Password123!')

    await assert.rejects(
      () => authService.rotateRefreshToken(accessToken),
      InvalidRefreshTokenException
    )

    const refreshTokens = await User.refreshTokens.all(user)
    assert.equal(refreshTokens.length, 1)
  })

  test('replaying a rotated refresh token throws and revokes every token of the user', async ({
    assert,
  }) => {
    const authService = new AuthService()
    const user = await UserTestFactory.create({
      email: 'reuse@example.com',
      password: 'Password123!',
    })
    const { refreshToken: oldRefreshToken } = await authService.login(
      'reuse@example.com',
      'Password123!'
    )
    await authService.rotateRefreshToken(oldRefreshToken)

    await assert.rejects(
      () => authService.rotateRefreshToken(oldRefreshToken),
      InvalidRefreshTokenException
    )

    const accessTokens = await User.accessTokens.all(user)
    const refreshTokens = await User.refreshTokens.all(user)
    assert.equal(accessTokens.length, 0)
    assert.equal(refreshTokens.length, 0)
  })

  test('rotation never mints a second token when the refresh token was already consumed', async ({
    assert,
  }) => {
    const authService = new AuthService()
    const user = await UserTestFactory.create({
      email: 'guard@example.com',
      password: 'Password123!',
    })
    const { refreshToken } = await authService.login('guard@example.com', 'Password123!')

    const tokens = await User.refreshTokens.all(user)
    const dbToken = tokens[0]!
    await db
      .from('auth_access_tokens')
      .where('id', String(dbToken.identifier))
      .where('type', 'refresh_token')
      .update({ expires_at: new Date(Date.now() - 1000) })

    const originalVerify = User.refreshTokens.verify
    ;(User.refreshTokens as any).verify = async () => dbToken

    try {
      await assert.rejects(
        () => authService.rotateRefreshToken(refreshToken),
        InvalidRefreshTokenException
      )
    } finally {
      ;(User.refreshTokens as any).verify = originalVerify
    }

    const refreshTokensAfter = await User.refreshTokens.all(user)
    const accessTokensAfter = await User.accessTokens.all(user)
    assert.equal(refreshTokensAfter.length, 1)
    assert.equal(accessTokensAfter.length, 1)
  })

  test('logout deletes the access and refresh tokens from DB', async ({ assert }) => {
    const authService = new AuthService()
    const user = await UserTestFactory.create({
      email: 'logout@example.com',
      password: 'Password123!',
    })
    const { accessToken: rawAccessToken, refreshToken } = await authService.login(
      'logout@example.com',
      'Password123!'
    )

    const tokens = await User.accessTokens.all(user)
    assert.equal(tokens.length, 1)

    await authService.logout(user, refreshToken, tokens[0]!)

    const accessTokensAfter = await User.accessTokens.all(user)
    const refreshTokensAfter = await User.refreshTokens.all(user)
    assert.equal(accessTokensAfter.length, 0)
    assert.equal(refreshTokensAfter.length, 0)
    assert.isNotEmpty(rawAccessToken)
  })

  test('logout without a refresh token only deletes the access token', async ({ assert }) => {
    const authService = new AuthService()
    const user = await UserTestFactory.create({
      email: 'logout-no-refresh@example.com',
      password: 'Password123!',
    })
    await authService.login('logout-no-refresh@example.com', 'Password123!')

    const tokens = await User.accessTokens.all(user)
    await authService.logout(user, null, tokens[0]!)

    const accessTokensAfter = await User.accessTokens.all(user)
    const refreshTokensAfter = await User.refreshTokens.all(user)
    assert.equal(accessTokensAfter.length, 0)
    assert.equal(refreshTokensAfter.length, 1)
  })

  test('changePassword updates the password', async ({ assert }) => {
    const authService = new AuthService()
    const user = await UserTestFactory.create({
      email: 'change-pw@example.com',
      password: 'OldPassword123!',
    })

    await authService.changePassword(user, 'NewPassword123!')

    const refreshed = await User.findOrFail(user.id)
    assert.isTrue(await hash.verify(refreshed.password!, 'NewPassword123!'))
    assert.isFalse(await hash.verify(refreshed.password!, 'OldPassword123!'))
  })

  test('changePassword participates in the transaction bound by the caller', async ({ assert }) => {
    const authService = new AuthService()
    const user = await UserTestFactory.create({
      email: 'rollback-pw@example.com',
      password: 'OldPassword123!',
    })

    await assert.rejects(async () => {
      await db.transaction(async (client) => {
        user.useTransaction(client)
        await authService.changePassword(user, 'NewPassword123!')
        throw new Error('boom')
      })
    })

    const refreshed = await User.findOrFail(user.id)
    assert.isTrue(await hash.verify(refreshed.password!, 'OldPassword123!'))
  })

  test('revokeAllTokens deletes every access and refresh token of the user', async ({ assert }) => {
    const authService = new AuthService()
    const user = await UserTestFactory.create({
      email: 'revoke-all@example.com',
      password: 'Password123!',
    })
    await authService.login('revoke-all@example.com', 'Password123!')

    const tokensBefore = await User.accessTokens.all(user)
    const refreshTokensBefore = await User.refreshTokens.all(user)
    assert.equal(tokensBefore.length, 1)
    assert.equal(refreshTokensBefore.length, 1)

    await authService.revokeAllTokens(user)

    const tokensAfter = await User.accessTokens.all(user)
    const refreshTokensAfter = await User.refreshTokens.all(user)
    assert.equal(tokensAfter.length, 0)
    assert.equal(refreshTokensAfter.length, 0)
  })
})
