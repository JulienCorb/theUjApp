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
import { loginThrottle, signupThrottle } from '#start/limiter'

router.get('/', () => {
  return { hello: 'world' }
})

router
  .group(() => {
    router
      .group(() => {
        router.post('signup', [controllers.NewAccount, 'store']).use(signupThrottle)
        router.post('login', [controllers.AccessTokens, 'store']).use(loginThrottle)
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        // TODO(security): add an authorization layer (policies/abilities) once
        // multi-user or admin resources are introduced. Currently authentication
        // is sufficient because all endpoints are self-scoped, but "authenticated"
        // must not be mistaken for "authorized" when new resources are added.
        router.get('profile', [controllers.Profile, 'show'])
        router.post('logout', [controllers.AccessTokens, 'destroy'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth())
  })
  .prefix('/api/v1')
