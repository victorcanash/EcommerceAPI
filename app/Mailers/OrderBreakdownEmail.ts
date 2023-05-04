import { BaseMailer, MessageContract } from '@ioc:Adonis/Addons/Mail'
import { I18nContract } from '@ioc:Adonis/Addons/I18n'
import Env from '@ioc:Adonis/Core/Env'
import View from '@ioc:Adonis/Core/View'

import mjml from 'mjml'
import NP from 'number-precision'

import Order from 'App/Models/Order'
import CloudinaryService from 'App/Services/CloudinaryService'
import { logSuccess } from 'App/Utils/logger'

export default class OrderBreakdownEmail extends BaseMailer {
  constructor(
    private i18n: I18nContract,
    private email: string,
    private firstName: string,
    private order: Order,
    private currencySymbol: string
  ) {
    super()
  }

  public async prepare(message: MessageContract) {
    const input = await View.render('emails/mjml/order-breakdown', {
      i18n: this.i18n,
      firstName: this.firstName,
      order: this.order,
      orderCreatedDate: this.i18n.formatDate(this.order.createdAt),
      subtotal: NP.plus(
        parseFloat(this.order.transaction?.amount.breakdown.itemTotal.value || '0'),
        parseFloat(this.order.transaction?.amount.breakdown.taxTotal.value || '0')
      ),
      discount: this.order.transaction?.amount.breakdown.discount.value || '0',
      shipping: this.order.transaction?.amount.breakdown.shipping.value || '0',
      total: this.order.transaction?.amount.value || '0',
      orderPath: this.order.guestUserId
        ? `laenvasadora.es/orders?id=${this.order.bigbuyId}&email=${this.email}`
        : 'laenvasadora.es/orders',
      currencySymbol: this.currencySymbol,
      cloudinarySrc: CloudinaryService.getFullSrc(),
    })

    message
      .subject(this.i18n.formatMessage('messages.emails.checkOrder.subject'))
      .from(Env.get('SMTP_EMAIL'))
      .to(this.email)
      .html(mjml(input).html)
    logSuccess('Sent email check order')
  }
}
