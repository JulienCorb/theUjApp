import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import InvitationPolicy from '#policies/invitation_policy'
import InvitationService from '#services/invitation_service'
import UserTransformer from '#transformers/user_transformer'
import { acceptInvitationValidator, validateInvitationValidator } from '#validators/invitation'
import { createUserValidator } from '#validators/user'

@inject()
export default class InvitationsController {
  constructor(protected invitationService: InvitationService) {}

  async store({ request, bouncer, response }: HttpContext) {
    const { email } = await request.validateUsing(createUserValidator)
    await bouncer.with(InvitationPolicy).authorize('create')

    await this.invitationService.invite(email, 'client')

    return response.status(201)
  }

  async validate({ request, serialize }: HttpContext) {
    const { token } = await request.validateUsing(validateInvitationValidator)
    const { valid, user } = await this.invitationService.validate(token)

    if (!valid) {
      return serialize({ valid: false })
    }

    return serialize({
      valid: true,
      user: UserTransformer.transform(user!),
    })
  }

  async accept({ request, serialize }: HttpContext) {
    const { token, password } = await request.validateUsing(acceptInvitationValidator)

    const { user, token: accessToken } = await this.invitationService.accept(token, password)

    return serialize({
      message: 'Account created successfully.',
      user: UserTransformer.transform(user),
      token: accessToken,
    })
  }
}
