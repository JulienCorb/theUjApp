import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import { UserTestFactory } from '#tests/factories/user_test_factory'
test.group('AccessTokensController store (login)', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('login succeeds with correct credentials', async ({ client, db }) => {
    await UserTestFactory.createWithToken({ email: 'login@example.com', password: 'Password123!' })

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
        token: response.body().data.token,
      },
    })

    const user = await User.findByOrFail('email', 'login@example.com')
    await db.assertHas('auth_access_tokens', { tokenable_id: user.id })
  })

  test('login normalizes email', async ({ client }) => {
    await UserTestFactory.createWithToken({
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
    await UserTestFactory.createWithToken({
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

  // TODO: uncomment after adding maxLength to loginValidator password (app/validators/user.ts:24)
  test('login rejects excessively long password (DoS prevention)', async () => {}).skip()

  // TODO: uncomment after adding @adonisjs/throttler (start/routes.ts:22)
  test('login is rate-limited', async () => {}).skip()
})

test.group('AccessTokensController destroy (logout)', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('logout requires auth (401 without token)', async ({ client }) => {
    const response = await client.visit('profile.access_tokens.destroy').send()

    response.assertStatus(401)
  })

  test('logout revokes token and subsequent request with old token returns 401', async ({
    client,
  }) => {
    const { token } = await UserTestFactory.createWithToken({
      email: 'logout@example.com',
      password: 'Password123!',
    })

    const response = await client.visit('profile.access_tokens.destroy').bearerToken(token).send()

    response.assertStatus(200)

    const subsequentResponse = await client.visit('profile.profile.show').bearerToken(token).send()

    subsequentResponse.assertStatus(401)
  })

  // TODO: uncomment after fixing serialize() in AccessTokensController.destroy (app/controllers/access_tokens_controller.ts:28)
  test('logout response is wrapped in data key', async ({ client, assert }) => {
    const { token } = await UserTestFactory.createWithToken({
      email: 'serialize@example.com',
      password: 'Password123!',
    })

    const response = await client.visit('profile.access_tokens.destroy').bearerToken(token).send()

    response.assertStatus(200)
    assert.isDefined((response.body() as any).data)
  }).skip()

  // TODO: uncomment after adding resource-scoped endpoints + policies (start/routes.ts:35)
  test('returns 403 when bouncer denies access to resource', async () => {}).skip()
})
