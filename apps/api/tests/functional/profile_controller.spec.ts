import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { assertRequiresAuth } from '#tests/helpers/auth'
import { UserTestFactory } from '#tests/factories/user_test_factory'

test.group('ProfileController show', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('profile returns authenticated user', async ({ client }) => {
    const { user, accessToken } = await UserTestFactory.createWithTokens({
      email: 'profile@example.com',
      password: 'Password123!',
    })

    const response = await client.visit('profile.profile.show').bearerToken(accessToken).send()

    response.assertStatus(200)
    response.assertBodyContains({
      data: {
        id: user.id,
        email: 'profile@example.com',
      },
    })
  })

  test('profile response contains exactly id, email, phoneNumber, role, createdAt, updatedAt', async ({
    client,
    assert,
  }) => {
    const { accessToken } = await UserTestFactory.createWithTokens({
      email: 'fields@example.com',
      password: 'Password123!',
    })

    const response = await client.visit('profile.profile.show').bearerToken(accessToken).send()

    response.assertStatus(200)
    const user = response.body().data
    assert.isDefined(user.id)
    assert.isDefined(user.email)
    assert.isDefined(user.role)
    assert.isDefined(user.createdAt)
    assert.isDefined(user.updatedAt)
    const keys = Object.keys(user).sort()
    assert.deepEqual(keys, ['createdAt', 'email', 'id', 'phoneNumber', 'role', 'updatedAt'].sort())
  })

  test('profile does not return password', async ({ client, assert }) => {
    const { accessToken } = await UserTestFactory.createWithTokens({
      email: 'nopassword@example.com',
      password: 'Password123!',
    })

    const response = await client.visit('profile.profile.show').bearerToken(accessToken).send()

    response.assertStatus(200)
    assert.isUndefined((response.body().data as any).password)
  })

  test('profile requires auth (401 without token)', async ({ client }) => {
    await assertRequiresAuth(client, 'profile.profile.show')
  })
})
