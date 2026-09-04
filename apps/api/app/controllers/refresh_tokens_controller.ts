import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import InvalidRefreshTokenException from '#exceptions/invalid_refresh_token_exception'
import AuthService from '#services/auth_service'
import { refreshTokenCookieName } from '#config/refresh_token'
import { setRefreshTokenCookie } from '#controllers/shared/refresh_token'

/**
 * Rotates the refresh token carried by the httpOnly cookie and issues a
 * fresh access token. The new refresh token is set as a cookie and never
 * returned in the response body — the web app never sees it.
 */
@inject()
export default class RefreshTokensController {
  constructor(protected authService: AuthService) {}

  async store({ request, response, serialize }: HttpContext) {
    const refreshToken = request.plainCookie(refreshTokenCookieName)
    if (!refreshToken) {
      throw new InvalidRefreshTokenException()
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.rotateRefreshToken(refreshToken)
    setRefreshTokenCookie(response, newRefreshToken)

    return serialize({
      accessToken,
    })
  }
}
