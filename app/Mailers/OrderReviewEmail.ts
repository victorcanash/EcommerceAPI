import { BaseMailer, MessageContract } from '@ioc:Adonis/Addons/Mail'
import { I18nContract } from '@ioc:Adonis/Addons/I18n'
import Env from '@ioc:Adonis/Core/Env'
import View from '@ioc:Adonis/Core/View'

import mjml from 'mjml'

import Order from 'App/Models/Order'
import CloudinaryService from 'App/Services/CloudinaryService'
import { logSuccess } from 'App/Utils/logger'

export default class OrderReviewEmail extends BaseMailer {
  constructor(
    private i18n: I18nContract,
    private email: string,
    private firstName: string,
    private order: Order
  ) {
    super()
  }

  public async prepare(message: MessageContract) {
    const input = await View.render('emails/mjml/order-review', {
      i18n: this.i18n,
      firstName: this.firstName,
      order: this.order,
      reviewPath: `https://laenvasadora.es/?email=${this.email}#reviews`,
      cloudinarySrc: CloudinaryService.getFullSrc(),
    })

    message
      .subject(this.i18n.formatMessage('¿Te ha gustado nuestro producto?'))
      .from(Env.get('SMTP_EMAIL'))
      .to(this.email)
      .html(mjml(input).html)
    logSuccess('Sent order review email')
  }
}
