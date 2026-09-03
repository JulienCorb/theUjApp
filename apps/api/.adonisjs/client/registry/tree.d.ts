/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  auth: {
    newAccount: {
      store: (typeof routes)['auth.new_account.store']
    }
    accessTokens: {
      store: (typeof routes)['auth.access_tokens.store']
    }
    passwordReset: {
      forgot: (typeof routes)['auth.password_reset.forgot']
      reset: (typeof routes)['auth.password_reset.reset']
    }
  }
  profile: {
    profile: {
      show: (typeof routes)['profile.profile.show']
    }
    accessTokens: {
      destroy: (typeof routes)['profile.access_tokens.destroy']
    }
  }
}
