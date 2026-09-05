import AuthService from '#services/auth_service'
import InvitationService from '#services/invitation_service'
import MailService from '#services/mail_service'
import UserService from '#services/user_service'

const invitationService = new InvitationService(
  new AuthService(),
  new MailService(),
  new UserService()
)

export interface InvitationTestFactoryOverrides {
  email?: string
  icc?: string
  localPhoneNumber?: string
}

/**
 * Default phone used when accepting an invitation (mandatory at accept time).
 */
export const DEFAULT_PHONE = { icc: '33', localPhoneNumber: '612345678' }

/**
 * Fixtures for the invitation flow. All methods call the real
 * InvitationService so fixtures exercise production business logic.
 *
 * Note: invitations are delivered by mail, so specs using this factory must
 * fake the mailer to suppress real delivery attempts.
 */
export class InvitationTestFactory {
  static async create(overrides?: InvitationTestFactoryOverrides) {
    const email = overrides?.email ?? `invited${Date.now()}${Math.random()}@test.com`
    const { icc, localPhoneNumber } = overrides ?? {}
    const { user, token } = await invitationService.invite(email, 'client', {
      icc,
      localPhoneNumber,
    })

    return { user, token }
  }

  static async createAccepted(overrides?: InvitationTestFactoryOverrides & { password?: string }) {
    const email = overrides?.email ?? `accepted${Date.now()}${Math.random()}@test.com`
    const password = overrides?.password ?? 'Password123!'
    const icc = overrides?.icc ?? DEFAULT_PHONE.icc
    const localPhoneNumber = overrides?.localPhoneNumber ?? DEFAULT_PHONE.localPhoneNumber
    const { user, token } = await this.create({ email, icc, localPhoneNumber })
    const { accessToken, refreshToken } = await invitationService.accept(token, password, {
      icc,
      localPhoneNumber,
    })

    return { user, token, accessToken, refreshToken, password }
  }
}
