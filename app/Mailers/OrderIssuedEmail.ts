import { BaseMailer, MessageContract } from '@ioc:Adonis/Addons/Mail'
import { I18nContract } from '@ioc:Adonis/Addons/I18n'
import Env from '@ioc:Adonis/Core/Env'
import View from '@ioc:Adonis/Core/View'

import mjml from 'mjml'

import Order from 'App/Models/Order'
import CloudinaryService from 'App/Services/CloudinaryService'
import { logSuccess } from 'App/Utils/logger'

export default class OrderIssuedEmail extends BaseMailer {
  constructor(
    private i18n: I18nContract,
    private email: string,
    private firstName: string,
    private order: Order
  ) {
    super()
  }

  public async prepare(message: MessageContract) {
    const input = await View.render('emails/mjml/order-issued', {
      i18n: this.i18n,
      firstName: this.firstName,
      order: this.order,
      orderPath: `https://laenvasadora.es/orders?id=${this.order.bigbuyId}&email=${this.email}`,
      cloudinarySrc: CloudinaryService.getFullSrc(),
    })

    message
      .subject('Pedido expedido')
      .from(Env.get('SMTP_EMAIL'))
      .to(this.email)
      .html(mjml(input).html)
    logSuccess('Sent order issued email')
  }
}
