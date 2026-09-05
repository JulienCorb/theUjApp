import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import InvitationPolicy from '#policies/invitation_policy'
import InvitationService from '#services/invitation_service'
import InvitationTransformer from '#transformers/invitation_transformer'
import UserTransformer from '#transformers/user_transformer'
import { acceptInvitationValidator, showInvitationValidator } from '#validators/invitation'
import { createUserValidator } from '#validators/user'
import { setRefreshTokenCookie } from '#controllers/shared/refresh_token'

@inject()
export default class InvitationsController {
  constructor(protected invitationService: InvitationService) {}

  async store({ request, bouncer, response }: HttpContext) {
    const { email, icc, localPhoneNumber } = await request.validateUsing(createUserValidator)
    await bouncer.with(InvitationPolicy).authorize('create')

    await this.invitationService.invite(email, 'client', { icc, localPhoneNumber })

    return response.status(201)
  }

  async show({ request, response, serialize }: HttpContext) {
    const { params } = await request.validateUsing(showInvitationValidator)
    const invitation = await this.invitationService.findActive(params.token)

    if (!invitation) {
      return response.notFound({ message: 'Invitation not found.' })
    }

    return serialize({ invitation: InvitationTransformer.transform(invitation) })
  }

  async accept({ request, response, serialize }: HttpContext) {
    const { token, password } = await request.validateUsing(acceptInvitationValidator)

    const { user, accessToken, refreshToken } = await this.invitationService.accept(token, password)
    setRefreshTokenCookie(response, refreshToken)

    return serialize({
      message: 'Account created successfully.',
      user: UserTransformer.transform(user),
      accessToken,
    })
  }
}
