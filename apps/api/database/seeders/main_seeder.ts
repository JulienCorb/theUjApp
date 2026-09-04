import { BaseSeeder } from '@adonisjs/lucid/seeders'

import User from '#models/user'
import UserService from '#services/user_service'

const userService = new UserService()

/**
 * Bootstraps the first internal user account, who can then invite clients
 * through the API. Idempotent: skips when the email already exists.
 *
 * Dev-only convenience — the seeded credentials are weak and committed on
 * purpose. Guard or replace before any production deploy.
 */
export default class extends BaseSeeder {
  async run() {
    const exists = await User.findBy('email', 'corbin.julien@gmail.com')
    if (exists) {
      return
    }

    await userService.createActiveUser('corbin.julien@gmail.com', 'Password123!', 'internal')
  }
}
