import type Invitation from '#models/invitation'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class InvitationTransformer extends BaseTransformer<Invitation> {
  toObject() {
    return this.pick(this.resource, ['id', 'expiresAt', 'icc', 'localPhoneNumber'])
  }
}
