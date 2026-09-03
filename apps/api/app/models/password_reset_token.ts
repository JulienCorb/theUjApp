import { PasswordResetTokenSchema } from '#database/schema'

export default class PasswordResetToken extends PasswordResetTokenSchema {
  static table = 'password_reset_tokens'
}
