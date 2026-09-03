import limiter from '@adonisjs/limiter/services/main'

export const signupThrottle = limiter.define('signup', () => {
  return limiter.allowRequests(5).every('1 minute')
})

export const loginThrottle = limiter.define('login', () => {
  return limiter.allowRequests(30).every('1 minute')
})

export const passwordResetRequestThrottle = limiter.define('password-reset-request', (ctx) => {
  return limiter
    .allowRequests(5)
    .every('15 minutes')
    .blockFor('30 minutes')
    .usingKey(`password_reset_request_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error.setMessage('Too many password reset requests. Please try again later.')
    })
})

export const passwordResetThrottle = limiter.define('password-reset', (ctx) => {
  return limiter
    .allowRequests(10)
    .every('15 minutes')
    .blockFor('30 minutes')
    .usingKey(`password_reset_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error.setMessage('Too many password reset attempts. Please try again later.')
    })
})
