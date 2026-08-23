import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserTestFactory } from '#tests/factories/user_test_factory'

test.group('NewAccountController store (signup)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('signup creates user and returns a token', async ({ client, db }) => {
    const response = await client
      .visit('auth.new_account.store')
      .json({
        email: 'signup@example.com',
        password: 'Password123!',
        passwordConfirmation: 'Password123!',
      })
      .send()

    response.assertStatus(200)
    response.assertBodyContains({
      data: {
        user: {
          email: 'signup@example.com',
        },
        token: response.body().data.token,
      },
    })

    await db.assertHas('users', { email: 'signup@example.com' })
  })

  test('signup normalizes email in response', async ({ client, db }) => {
    const response = await client
      .visit('auth.new_account.store')
      .json({
        email: '  Foo@BAR.com  ',
        password: 'Password123!',
        passwordConfirmation: 'Password123!',
      })
      .send()

    response.assertStatus(200)
    response.assertBodyContains({
      data: {
        user: {
          email: 'foo@bar.com',
        },
      },
    })

    await db.assertHas('users', { email: 'foo@bar.com' })
  })

  test('signup response is wrapped in data key', async ({ client, assert }) => {
    const response = await client
      .visit('auth.new_account.store')
      .json({
        email: 'wrapper@example.com',
        password: 'Password123!',
        passwordConfirmation: 'Password123!',
      })
      .send()

    response.assertStatus(200)
    assert.isDefined(response.body().data)
  })

  test('signup does not return password in response', async ({ client, assert }) => {
    const response = await client
      .visit('auth.new_account.store')
      .json({
        email: 'nopw@example.com',
        password: 'Password123!',
        passwordConfirmation: 'Password123!',
      })
      .send()

    response.assertStatus(200)
    assert.isUndefined((response.body().data as any).user.password)
  })

  test('signup validation: missing email returns 422', async ({ client }) => {
    const response = await client
      .visit('auth.new_account.store')
      .json({
        password: 'Password123!',
        passwordConfirmation: 'Password123!',
      } as any)
      .send()

    response.assertStatus(422)
  })

  test('signup validation: missing password returns 422', async ({ client }) => {
    const response = await client
      .visit('auth.new_account.store')
      .json({
        email: 'missingpw@example.com',
      } as any)
      .send()

    response.assertStatus(422)
  })

  test('signup validation: invalid email format returns 422', async ({ client }) => {
    const response = await client
      .visit('auth.new_account.store')
      .json({
        email: 'not-an-email',
        password: 'Password123!',
        passwordConfirmation: 'Password123!',
      })
      .send()

    response.assertStatus(422)
  })

  test('signup validation: password too short returns 422', async ({ client }) => {
    const response = await client
      .visit('auth.new_account.store')
      .json({
        email: 'shortpw@example.com',
        password: 'Short1!',
        passwordConfirmation: 'Short1!',
      })
      .send()

    response.assertStatus(422)
  })

  test('signup validation: password too long returns 422', async ({ client }) => {
    const response = await client
      .visit('auth.new_account.store')
      .json({
        email: 'longpw@example.com',
        password: 'A'.repeat(33),
        passwordConfirmation: 'A'.repeat(33),
      })
      .send()

    response.assertStatus(422)
  })

  test('signup validation: passwordConfirmation mismatch returns 422', async ({ client }) => {
    const response = await client
      .visit('auth.new_account.store')
      .json({
        email: 'mismatch@example.com',
        password: 'Password123!',
        passwordConfirmation: 'DifferentPassword!',
      })
      .send()

    response.assertStatus(422)
  })

  test('signup validation: duplicate email returns 422', async ({ client, db }) => {
    await UserTestFactory.createWithToken({ email: 'duplicate@example.com' })

    const response = await client
      .visit('auth.new_account.store')
      .json({
        email: 'duplicate@example.com',
        password: 'Password123!',
        passwordConfirmation: 'Password123!',
      })
      .send()

    response.assertStatus(422)

    await db.assertCount('users', 1)
  })

  // TODO: uncomment after adding @adonisjs/throttler (start/routes.ts:22)
  test('signup is rate-limited', async () => {}).skip()
})
