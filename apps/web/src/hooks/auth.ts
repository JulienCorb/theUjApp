import { useMutation, useQuery } from '@tanstack/react-query'

import { api, client } from '#/lib/tuyau'
import { queryClient } from '#/lib/query-client'
import { clearToken, getToken, setToken } from '#/lib/auth-store'

export function isAuthenticated() {
  return getToken() !== null
}

export const profileQueryOptions = () =>
  api.profile.profile.show.queryOptions({}, { retry: false })

export function useProfile() {
  return useQuery(profileQueryOptions())
}

export function useLogin() {
  return useMutation(
    api.auth.accessTokens.store.mutationOptions({
      onSuccess: ({ data }) => {
        setToken(data.token)
        queryClient.invalidateQueries({
          queryKey: api.profile.profile.pathKey(),
        })
      },
    }),
  )
}

export function useLogout() {
  return useMutation({
    mutationFn: () => client.api.profile.accessTokens.destroy({}),
    onSuccess: () => {
      clearToken()
      queryClient.clear()
    },
  })
}

export function useForgotPassword() {
  return useMutation(api.auth.passwordReset.forgot.mutationOptions())
}

export function useResetPassword() {
  return useMutation(api.auth.passwordReset.reset.mutationOptions())
}
