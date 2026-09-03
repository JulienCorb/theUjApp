import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import PasswordResetService from '#services/password_reset_service'
import { requestPasswordResetValidator, resetPasswordValidator } from '#validators/password_reset'

@inject()
export default class PasswordResetController {
  constructor(protected passwordResetService: PasswordResetService) {}

  async forgot({ request, response, serialize }: HttpContext) {
    const { email } = await request.validateUsing(requestPasswordResetValidator)
    await this.passwordResetService.requestReset(email)

    response.status(202)
    return serialize({
      message: 'If an account exists for that email, a password reset link has been sent.',
    })
  }

  async reset({ request, serialize }: HttpContext) {
    const { token, password } = await request.validateUsing(resetPasswordValidator)
    await this.passwordResetService.reset(token, password)

    return serialize({ message: 'Password reset successfully.' })
  }
}
