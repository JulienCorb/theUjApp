import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AuthService from '#services/auth_service'
import UserTransformer from '#transformers/user_transformer'
import { signupValidator } from '#validators/user'

@inject()
export default class NewAccountController {
  constructor(protected authService: AuthService) {}

  async store({ request, serialize }: HttpContext) {
    const { email, password } = await request.validateUsing(signupValidator)

    const { user, token } = await this.authService.register(email, password)

    return serialize({
      user: UserTransformer.transform(user),
      token,
    })
  }
}
