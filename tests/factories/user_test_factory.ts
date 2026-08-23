import AuthService from '#services/auth_service'

const authService = new AuthService()

export class UserTestFactory {
  static async create(overrides?: { email?: string; password?: string }) {
    const email = overrides?.email ?? `user${Date.now()}${Math.random()}@test.com`
    const password = overrides?.password ?? 'Password123!'
    const { user } = await authService.register(email, password)
    return user
  }

  static async createWithToken(overrides?: { email?: string; password?: string }) {
    const email = overrides?.email ?? `user${Date.now()}${Math.random()}@test.com`
    const password = overrides?.password ?? 'Password123!'
    const { user, token } = await authService.register(email, password)
    return { user, token }
  }
}
