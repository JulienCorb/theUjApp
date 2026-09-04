import AuthService from '#services/auth_service'
import MailService from '#services/mail_service'
import PasswordResetService from '#services/password_reset_service'
import User from '#models/user'

const passwordResetService = new PasswordResetService(new AuthService(), new MailService())

/**
 * Fixtures for the password reset flow. All methods call the real
 * PasswordResetService so fixtures exercise production business logic.
 */
export class PasswordResetTestFactory {
  /**
   * Issues a fresh reset token for the user matching the email and returns
   * the raw token (the email is not sent — delivery is covered by the
   * service's own specs).
   */
  static async requestReset(email: string) {
    const user = await User.findByOrFail('email', email)
    const { token } = await passwordResetService.issue(user.id)

    return token
  }
}
