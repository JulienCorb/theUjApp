import { BasePolicy } from '@adonisjs/bouncer'

import type User from '#models/user'

export default class InvitationPolicy extends BasePolicy {
  /**
   * Only internal users can create invitations (invite clients).
   */
  create(user: User) {
    return user.role === 'internal'
  }
}
