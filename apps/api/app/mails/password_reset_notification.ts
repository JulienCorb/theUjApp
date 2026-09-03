import { BaseMail } from '@adonisjs/mail'
import type { DateTime } from 'luxon'

import { appName } from '#config/app'
import { webAppUrl } from '#config/password_reset'
import type User from '#models/user'

export default class PasswordResetNotification extends BaseMail {
  subject = 'Réinitialisation de votre mot de passe'

  constructor(
    private user: User,
    private token: string,
    private expiresAt: DateTime
  ) {
    super()
  }

  getResetToken() {
    return this.token
  }

  prepare() {
    const resetUrl = `${webAppUrl}/reset-password?token=${encodeURIComponent(this.token)}`
    const expiresInMinutes = Math.max(1, Math.ceil(this.expiresAt.diffNow('minutes').minutes))

    this.message.to(this.user.email)

    this.message.html(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Réinitialisation de votre mot de passe</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 24px;">
          <div style="max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 32px; border-radius: 12px;">
            <h1 style="margin-top: 0;">Réinitialisation de votre mot de passe</h1>
            <p>Bonjour,</p>
            <p>Nous avons reçu une demande de réinitialisation du mot de passe de votre compte ${appName}.</p>
            <p style="text-align: center; margin: 28px 0;">
              <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px;">
                Réinitialiser mon mot de passe
              </a>
            </p>
            <p>Ou copiez-collez cette URL dans votre navigateur :</p>
            <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
            <p>Ce lien expire dans ${expiresInMinutes} minute(s) et ne peut être utilisé qu'une seule fois.</p>
            <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.</p>
            <p style="margin-top: 28px; font-size: 13px; color: #666;">L'équipe ${appName}</p>
          </div>
        </body>
      </html>
    `)
    this.message.text(`
      Réinitialisation de votre mot de passe

      Bonjour,

      Nous avons reçu une demande de réinitialisation du mot de passe de votre compte ${appName}.

      Ouvrez l'URL suivante pour choisir un nouveau mot de passe :
      ${resetUrl}

      Ce lien expire dans ${expiresInMinutes} minute(s) et ne peut être utilisé qu'une seule fois.

      Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.

      L'équipe ${appName}
    `)
  }
}
