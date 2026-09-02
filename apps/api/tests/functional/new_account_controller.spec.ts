import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import limiter from '@adonisjs/limiter/services/main'
import { UserTestFactory } from '#tests/factories/user_test_factory'
import { MAX_SIGNUP_PASSWORD_LENGTH, MIN_SIGNUP_PASSWORD_LENGTH } from '#validators/user'

test.group('NewAccountController store (signup)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(async () => {
    await limiter.clear()
  })

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
        password: 'A'.repeat(MIN_SIGNUP_PASSWORD_LENGTH - 1),
        passwordConfirmation: 'A'.repeat(MIN_SIGNUP_PASSWORD_LENGTH - 1),
      })
      .send()

    response.assertStatus(422)
  })

  test('signup validation: password too long returns 422', async ({ client }) => {
    const response = await client
      .visit('auth.new_account.store')
      .json({
        email: 'longpw@example.com',
        password: 'A'.repeat(MAX_SIGNUP_PASSWORD_LENGTH + 1),
        passwordConfirmation: 'A'.repeat(MAX_SIGNUP_PASSWORD_LENGTH + 1),
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

  test('signup is rate-limited', async ({ client, assert }) => {
    for (let i = 0; i < 5; i++) {
      const response = await client
        .visit('auth.new_account.store')
        .json({
          email: `ratelimit${i}@example.com`,
          password: 'Password123!',
          passwordConfirmation: 'Password123!',
        })
        .send()

      response.assertStatus(200)
    }

    const response = await client
      .visit('auth.new_account.store')
      .json({
        email: 'ratelimited@example.com',
        password: 'Password123!',
        passwordConfirmation: 'Password123!',
      })
      .send()

    response.assertStatus(429)
    assert.equal((response.body() as any).errors[0].message, 'Too many requests')
    assert.isNumber((response.body() as any).errors[0].retryAfter)
  })
})
