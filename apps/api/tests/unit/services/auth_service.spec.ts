import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import hash from '@adonisjs/core/services/hash'
import AuthService from '#services/auth_service'
import User from '#models/user'

test.group('AuthService', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('register stores a password that verifies with hash', async ({ assert }) => {
    const authService = new AuthService()
    const { user } = await authService.register('test@example.com', 'Password123!')

    assert.isDefined(user.password)
    assert.isNotEmpty(user.password)
    assert.isTrue(await hash.verify(user.password, 'Password123!'))
  })

  test('register normalizes email (trim + lowercase) before persisting', async ({ assert }) => {
    const authService = new AuthService()
    const { user } = await authService.register('  Foo@BAR.com  ', 'Password123!')

    assert.equal(user.email, 'foo@bar.com')
  })

  test('register returns a non-empty token string', async ({ assert }) => {
    const authService = new AuthService()
    const { token } = await authService.register('token-test@example.com', 'Password123!')

    assert.isString(token)
    assert.isNotEmpty(token)
  })

  test('login rejects unknown email', async ({ assert }) => {
    const authService = new AuthService()

    assert.rejects(
      () => authService.login('nonexistent@example.com', 'Password123!'),
      'Invalid user credentials'
    )
  })

  test('login rejects wrong password', async ({ assert }) => {
    const authService = new AuthService()
    await authService.register('wrongpw@example.com', 'Password123!')

    assert.rejects(
      () => authService.login('wrongpw@example.com', 'WrongPassword!'),
      'Invalid user credentials'
    )
  })

  test('login normalizes email before verifying credentials', async ({ assert }) => {
    const authService = new AuthService()
    await authService.register('normalize@example.com', 'Password123!')

    const { user } = await authService.login('  NORMALIZE@example.com  ', 'Password123!')

    assert.equal(user.email, 'normalize@example.com')
  })

  test('login returns a non-empty token string', async ({ assert }) => {
    const authService = new AuthService()
    await authService.register('login-token@example.com', 'Password123!')

    const { token } = await authService.login('login-token@example.com', 'Password123!')

    assert.isString(token)
    assert.isNotEmpty(token)
  })

  test('logout deletes the token from DB', async ({ assert }) => {
    const authService = new AuthService()
    const { user } = await authService.register('logout@example.com', 'Password123!')

    const tokens = await User.accessTokens.all(user)
    assert.equal(tokens.length, 1)

    const accessToken = tokens[0]!
    await authService.logout(user, accessToken)

    const tokensAfter = await User.accessTokens.all(user)
    assert.equal(tokensAfter.length, 0)
  })

  test('token expires after 7 days (expiresAt is set)', async ({ assert }) => {
    const authService = new AuthService()
    const { user } = await authService.register('expiry@example.com', 'Password123!')

    const tokens = await User.accessTokens.all(user)
    const dbToken = tokens[0]!

    assert.isOk(dbToken.expiresAt)

    const now = new Date()
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const diffMs = Math.abs(dbToken.expiresAt!.getTime() - sevenDaysLater.getTime())

    assert.isBelow(diffMs, 5 * 60 * 1000)
  })
})
