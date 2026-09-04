import { test } from '@japa/runner'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'

import User from '#models/user'
import UserService from '#services/user_service'
import { UserTestFactory } from '#tests/factories/user_test_factory'

const userService = new UserService()

test.group('UserService', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('createActiveUser creates an active account with the given role', async ({ assert }) => {
    const user = await userService.createActiveUser('active@example.com', 'Password123!', 'client')

    assert.equal(user.email, 'active@example.com')
    assert.equal(user.role, 'client')
    assert.isTrue(await hash.verify(user.password!, 'Password123!'))
  })

  test('createActiveUser normalizes the email (trim + lowercase)', async ({ assert }) => {
    const user = await userService.createActiveUser('  Foo@BAR.com  ', 'Password123!', 'client')

    assert.equal(user.email, 'foo@bar.com')
  })

  test('findOrCreateInvited creates an invited user without a password', async ({ assert }) => {
    const user = await userService.findOrCreateInvited('invited@example.com', 'client')

    assert.equal(user.email, 'invited@example.com')
    assert.equal(user.role, 'client')

    const refreshed = await User.findOrFail(user.id)
    assert.isNull(refreshed.password)
  })

  test('findOrCreateInvited normalizes the email (trim + lowercase)', async ({ assert }) => {
    const user = await userService.findOrCreateInvited('  Invited@Example.COM  ', 'client')

    assert.equal(user.email, 'invited@example.com')
  })

  test('findOrCreateInvited returns the existing invited user instead of duplicating it', async ({
    assert,
  }) => {
    const first = await userService.findOrCreateInvited('again@example.com', 'client')
    const second = await userService.findOrCreateInvited('again@example.com', 'client')

    assert.equal(second.id, first.id)
    const { count } = (await db
      .from('users')
      .where('email', 'again@example.com')
      .count('*')
      .first())!
    assert.equal(Number(count), 1)
  })

  test('findOrCreateInvited rejects an email that already has an active account', async ({
    assert,
  }) => {
    await UserTestFactory.create({ email: 'active@example.com' })

    await assert.rejects(
      () => userService.findOrCreateInvited('active@example.com', 'client'),
      'A user account already exists for this email'
    )
  })
})
