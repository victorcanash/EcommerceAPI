import { BaseMailer, MessageContract } from '@ioc:Adonis/Addons/Mail'
import { I18nContract } from '@ioc:Adonis/Addons/I18n'
import View from '@ioc:Adonis/Core/View'
import Env from '@ioc:Adonis/Core/Env'

import mjml from 'mjml'

import Order from 'App/Models/Order'
import { logSuccess } from 'App/Utils/logger'

export default class CheckOrderEmail extends BaseMailer {
  /**
   * WANT TO USE A DIFFERENT MAILER?
   *
   * Uncomment the following line of code to use a different
   * mailer and chain the ".options" method to pass custom
   * options to the send method
   */
  // public mailer = this.mail.use()

  private currentYear = new Date().getFullYear()

  public html = mjml(
    View.render('emails/orders/check-order', {
      i18n: this.i18n,
      appName: this.appName,
      appDomain: this.appDomain,
      currentYear: this.currentYear,
      firstName: this.firstName,
      order: this.order,
    })
  ).html

  constructor(
    private i18n: I18nContract,
    private appName: string,
    private appDomain: string,
    private email: string,
    private firstName: string,
    private order: Order
  ) {
    super()
  }

  /**
   * The prepare method is invoked automatically when you run
   * "CheckOrderEmail.send".
   *
   * Use this method to prepare the email message. The method can
   * also be async.
   */
  public async prepare(message: MessageContract) {
    message
      .subject(this.i18n.formatMessage('messages.emails.checkOrder.subject'))
      .from(Env.get('SMTP_EMAIL'))
      .to(this.email)
      .html(await this.html)
    logSuccess('Sent email check order')
  }
}
