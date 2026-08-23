import type { ApiClient } from '@japa/api-client'

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

interface AuthTestOptions {
  method?: HttpMethod
  body?: Record<string, any>
}

async function buildRequest(client: ApiClient, routeName: string, options?: AuthTestOptions) {
  const request = (client as any).visit(routeName)
  if (options?.body) {
    request.json(options.body)
  }
  return request.send()
}

export async function assertRequiresAuth(
  client: ApiClient,
  routeName: string,
  options?: AuthTestOptions
) {
  const response = await buildRequest(client, routeName, options)
  response.assertStatus(401)
}

export async function assertRequiresAuthorization(
  client: ApiClient,
  routeName: string,
  token: string,
  options?: AuthTestOptions
) {
  const request = (client as any).visit(routeName).bearerToken(token)
  if (options?.body) {
    request.json(options.body)
  }
  const response = await request.send()
  response.assertStatus(403)
}
