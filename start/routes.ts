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

router.get('/', () => {
  return { hello: 'world' }
})

router
  .group(() => {
    router
      .group(() => {
        // TODO(security): add rate limiting via @adonisjs/throttler on signup/login.
        // Without it, attackers can brute-force passwords and create mass accounts
        // at will. Apply a stricter limit on signup (e.g. 5/min/IP) and a looser
        // one on login (e.g. 30/min/IP) to block credential stuffing without
        // locking out legitimate users.
        router.post('signup', [controllers.NewAccount, 'store'])
        router.post('login', [controllers.AccessTokens, 'store'])
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
