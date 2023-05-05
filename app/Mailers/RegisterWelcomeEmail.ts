import { BaseMailer, MessageContract } from '@ioc:Adonis/Addons/Mail'
import { I18nContract } from '@ioc:Adonis/Addons/I18n'
import Env from '@ioc:Adonis/Core/Env'
import View from '@ioc:Adonis/Core/View'

import mjml from 'mjml'

import CloudinaryService from 'App/Services/CloudinaryService'
import { logSuccess } from 'App/Utils/logger'

export default class RegisterWelcomeEmail extends BaseMailer {
  constructor(private i18n: I18nContract, private email: string, private firstName: string) {
    super()
  }

  public async prepare(message: MessageContract) {
    const input = await View.render('emails/mjml/register-welcome', {
      i18n: this.i18n,
      firstName: this.firstName,
      cloudinarySrc: CloudinaryService.getFullSrc(),
    })

    message
      .subject(this.i18n.formatMessage('Bienvenido a La Envasadora'))
      .from(Env.get('SMTP_EMAIL'))
      .to(this.email)
      .html(mjml(input).html)
    logSuccess('Sent register welcome email')
  }
}
