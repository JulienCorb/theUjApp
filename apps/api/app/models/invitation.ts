import { InvitationSchema } from '#database/schema'

export default class Invitation extends InvitationSchema {
  static table = 'invitations'
}
