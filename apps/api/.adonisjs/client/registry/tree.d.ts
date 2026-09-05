/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  auth: {
    accessTokens: {
      store: typeof routes['auth.access_tokens.store']
    }
    refreshTokens: {
      store: typeof routes['auth.refresh_tokens.store']
    }
    passwordReset: {
      forgot: typeof routes['auth.password_reset.forgot']
      reset: typeof routes['auth.password_reset.reset']
    }
    invitations: {
      accept: typeof routes['auth.invitations.accept']
      show: typeof routes['auth.invitations.show']
    }
  }
  invitations: {
    invitations: {
      store: typeof routes['invitations.invitations.store']
    }
  }
  profile: {
    profile: {
      show: typeof routes['profile.profile.show']
    }
    accessTokens: {
      destroy: typeof routes['profile.access_tokens.destroy']
    }
  }
}
