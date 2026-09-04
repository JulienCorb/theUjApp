import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AuthService from '#services/auth_service'
import UserTransformer from '#transformers/user_transformer'
import { loginValidator } from '#validators/user'
import { refreshTokenCookieName } from '#config/refresh_token'
import { clearRefreshTokenCookie, setRefreshTokenCookie } from '#controllers/shared/refresh_token'

@inject()
export default class AccessTokensController {
  constructor(protected authService: AuthService) {}

  async store({ request, response, serialize }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    const { user, accessToken, refreshToken } = await this.authService.login(email, password)
    setRefreshTokenCookie(response, refreshToken)

    return serialize({
      user: UserTransformer.transform(user),
      accessToken,
    })
  }

  async destroy({ auth, request, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const refreshToken = request.plainCookie(refreshTokenCookieName)
    if (user.currentAccessToken) {
      await this.authService.logout(user, refreshToken ?? null, user.currentAccessToken)
    }
    clearRefreshTokenCookie(response)

    return serialize({
      message: 'Logged out successfully',
    })
  }
}
