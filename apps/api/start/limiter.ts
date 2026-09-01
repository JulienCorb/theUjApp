import limiter from '@adonisjs/limiter/services/main'

export const signupThrottle = limiter.define('signup', () => {
  return limiter.allowRequests(5).every('1 minute')
})

export const loginThrottle = limiter.define('login', () => {
  return limiter.allowRequests(30).every('1 minute')
})
