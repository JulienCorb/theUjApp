import { BaseMail } from '@adonisjs/mail'
import type { DateTime } from 'luxon'

import { appName } from '#config/app'
import { webAppUrl } from '#config/invitation'
import type User from '#models/user'

export default class InvitationNotification extends BaseMail {
  subject = 'Invitation à rejoindre votre compte'

  constructor(
    private user: User,
    private token: string,
    private expiresAt: DateTime
  ) {
    super()
  }

  getInvitationToken() {
    return this.token
  }

  prepare() {
    const inviteUrl = `${webAppUrl}/accept-invitation?token=${encodeURIComponent(this.token)}`
    const expiresInDays = Math.max(1, Math.ceil(this.expiresAt.diffNow('days').days))

    this.message.to(this.user.email)

    this.message.html(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Invitation à rejoindre votre compte</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 24px;">
          <div style="max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 32px; border-radius: 12px;">
            <h1 style="margin-top: 0;">Invitation à rejoindre votre compte</h1>
            <p>Bonjour,</p>
            <p>Vous avez été invité à créer un compte ${appName} avec l'adresse e-mail ${this.user.email}.</p>
            <p style="text-align: center; margin: 28px 0;">
              <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px;">
                Créer mon compte
              </a>
            </p>
            <p>Ou copiez-collez cette URL dans votre navigateur :</p>
            <p style="word-break: break-all; color: #2563eb;">${inviteUrl}</p>
            <p>Ce lien expire dans ${expiresInDays} jour(s) et ne peut être utilisé qu'une seule fois.</p>
            <p>Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet e-mail en toute sécurité.</p>
            <p style="margin-top: 28px; font-size: 13px; color: #666;">L'équipe ${appName}</p>
          </div>
        </body>
      </html>
    `)
    this.message.text(`
      Invitation à rejoindre votre compte

      Bonjour,

      Vous avez été invité à créer un compte ${appName} avec l'adresse e-mail ${this.user.email}.

      Ouvrez l'URL suivante pour choisir un mot de passe :
      ${inviteUrl}

      Ce lien expire dans ${expiresInDays} jour(s) et ne peut être utilisé qu'une seule fois.

      Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet e-mail en toute sécurité.

      L'équipe ${appName}
    `)
  }
}
