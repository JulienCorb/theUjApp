/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'
import {
  createInvitationThrottle,
  invitationAcceptThrottle,
  loginThrottle,
  passwordResetRequestThrottle,
  passwordResetThrottle,
  refreshThrottle,
} from '#start/limiter'

router.get('/', () => {
  return { hello: 'world' }
})

router
  .group(() => {
    router
      .group(() => {
        router.post('login', [controllers.AccessTokens, 'store']).use(loginThrottle)
        router.post('refresh', [controllers.RefreshTokens, 'store']).use(refreshThrottle)
        router
          .post('forgot-password', [controllers.PasswordReset, 'forgot'])
          .use(passwordResetRequestThrottle)
        router
          .post('reset-password', [controllers.PasswordReset, 'reset'])
          .use(passwordResetThrottle)
        router
          .post('invitations/accept', [controllers.Invitations, 'accept'])
          .use(invitationAcceptThrottle)
        router.get('invitations/:token', [controllers.Invitations, 'show'])
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.post('', [controllers.Invitations, 'store']).use(createInvitationThrottle)
      })
      .prefix('invitations')
      .as('invitations')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('profile', [controllers.Profile, 'show'])
        router.post('logout', [controllers.AccessTokens, 'destroy'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth())
  })
  .prefix('/api/v1')
