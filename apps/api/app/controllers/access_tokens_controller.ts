import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AuthService from '#services/auth_service'
import UserTransformer from '#transformers/user_transformer'
import { loginValidator } from '#validators/user'

@inject()
export default class AccessTokensController {
  constructor(protected authService: AuthService) {}

  async store({ request, serialize }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    const { user, token } = await this.authService.login(email, password)

    return serialize({
      user: UserTransformer.transform(user),
      token,
    })
  }

  async destroy({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    if (user.currentAccessToken) {
      await this.authService.logout(user, user.currentAccessToken)
    }

    return serialize({
      message: 'Logged out successfully',
    })
  }
}
