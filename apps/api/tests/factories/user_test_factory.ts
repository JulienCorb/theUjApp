import type { UserRole } from '#models/user'
import AuthService from '#services/auth_service'
import UserService from '#services/user_service'

const authService = new AuthService()
const userService = new UserService()

export interface UserTestFactoryOverrides {
  email?: string
  password?: string
  role?: UserRole
}

export class UserTestFactory {
  static async create(overrides?: UserTestFactoryOverrides) {
    const email = overrides?.email ?? `user${Date.now()}${Math.random()}@test.com`
    const password = overrides?.password ?? 'Password123!'
    const role = overrides?.role ?? 'client'
    const user = await userService.createActiveUser(email, password, role)
    return user
  }

  static async createWithToken(overrides?: UserTestFactoryOverrides) {
    const password = overrides?.password ?? 'Password123!'
    const user = await this.create(overrides)
    const { token } = await authService.login(user.email, password)
    return { user, token }
  }
}
