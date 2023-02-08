import Mail from '@ioc:Adonis/Addons/Mail'
import Env from '@ioc:Adonis/Core/Env'
import { I18nContract } from '@ioc:Adonis/Addons/I18n'

import User from 'App/Models/User'
import GuestUser from 'App/Models/GuestUser'
import UserAddress from 'App/Models/UserAddress'
import Order from 'App/Models/Order'
import { GuestUserCheckoutAddress } from 'App/Types/user'

export default class MailService {
  public static async sendConfirmationEmail(
    guestUser: GuestUser,
    username: string,
    i18n: I18nContract,
    appName: string,
    appDomain: string,
    btnUrl: string
  ) {
    const currentYear = new Date().getFullYear()
    Mail.send((message) => {
      message
        .from(Env.get('SMTP_EMAIL'))
        .to(guestUser.email)
        .subject(i18n.formatMessage('messages.emails.confirmTransaction.subject'))
        .htmlView('emails/auth', {
          i18n,
          appName,
          appDomain,
          currentYear,
          username,
          description: i18n.formatMessage('messages.emails.confirmTransaction.description'),
          btnTxt: i18n.formatMessage('messages.emails.confirmTransaction.button'),
          btnUrl,
        })
    })
  }

  public static async sendActivationEmail(
    user: User,
    i18n: I18nContract,
    appName: string,
    appDomain: string,
    btnUrl: string
  ) {
    const currentYear = new Date().getFullYear()
    Mail.send((message) => {
      message
        .from(Env.get('SMTP_EMAIL'))
        .to(user.email)
        .subject(i18n.formatMessage('messages.emails.auth.activation.subject'))
        .htmlView('emails/auth', {
          i18n,
          appName,
          appDomain,
          currentYear,
          username: user.firstName,
          description: i18n.formatMessage('messages.emails.auth.activation.description'),
          btnTxt: i18n.formatMessage('messages.emails.auth.activation.button'),
          btnUrl,
        })
    })
  }

  public static async sendResetPswEmail(
    user: User,
    i18n: I18nContract,
    appName: string,
    appDomain: string,
    btnUrl: string
  ) {
    const currentYear = new Date().getFullYear()
    Mail.send((message) => {
      message
        .from(Env.get('SMTP_EMAIL'))
        .to(user.email)
        .subject(i18n.formatMessage('messages.emails.auth.resetPsw.subject'))
        .htmlView('emails/auth', {
          i18n,
          appName,
          appDomain,
          currentYear,
          username: user.firstName,
          description: i18n.formatMessage('messages.emails.auth.resetPsw.description'),
          btnTxt: i18n.formatMessage('messages.emails.auth.resetPsw.button'),
          btnUrl,
        })
    })
  }

  public static async sendUpdateEmail(
    user: User,
    i18n: I18nContract,
    appName: string,
    appDomain: string,
    btnUrl: string,
    email: string,
    revert = false
  ) {
    const currentYear = new Date().getFullYear()
    const subject = revert
      ? i18n.formatMessage('messages.emails.auth.revertEmail.subject')
      : i18n.formatMessage('messages.emails.auth.updateEmail.subject')
    const description = revert
      ? i18n.formatMessage('messages.emails.auth.revertEmail.description')
      : i18n.formatMessage('messages.emails.auth.updateEmail.description')
    const btnTxt = revert
      ? i18n.formatMessage('messages.emails.auth.revertEmail.button')
      : i18n.formatMessage('messages.emails.auth.updateEmail.button')
    Mail.send((message) => {
      message.from(Env.get('SMTP_EMAIL')).to(email).subject(subject).htmlView('emails/auth', {
        i18n,
        appName,
        appDomain,
        currentYear,
        username: user.firstName,
        description,
        btnTxt,
        btnUrl,
      })
    })
  }

  public static async sendContactEmail(
    i18n: I18nContract,
    appName: string,
    appDomain: string,
    userContact: { email: string; firstName: string; tlf?: string; comments: string }
  ) {
    const currentYear = new Date().getFullYear()
    Mail.send((message) => {
      message
        .from(Env.get('SMTP_EMAIL'))
        .to(Env.get('SMTP_EMAIL'))
        .subject('User Contact')
        .htmlView('emails/contact', {
          locale: i18n.locale,
          appName,
          appDomain,
          currentYear,
          userContact,
        })
    })
  }

  public static async sendCheckOrderEmail(
    i18n: I18nContract,
    appName: string,
    appDomain: string,
    email: string,
    firstName: string,
    order: Order
  ) {
    const currentYear = new Date().getFullYear()
    Mail.send((message) => {
      message
        .from(Env.get('SMTP_EMAIL'))
        .to(email)
        .subject(i18n.formatMessage('messages.emails.checkOrder.subject'))
        .htmlView('emails/orders/check-order', {
          i18n,
          appName,
          appDomain,
          currentYear,
          firstName,
          order,
        })
    })
  }

  public static async sendErrorCreateOrderEmail(
    i18n: I18nContract,
    appName: string,
    appDomain: string,
    userEmail: string,
    shipping: UserAddress | GuestUserCheckoutAddress,
    errorMsg: string,
    braintreeTransactionId: string,
    products: (
      | {
          reference: string
          quantity: number
          internalReference: string
        }
      | undefined
    )[]
  ) {
    const currentYear = new Date().getFullYear()
    const currentDate = new Date().toLocaleDateString()
    Mail.send((message) => {
      message
        .from(Env.get('SMTP_EMAIL'))
        .to(Env.get('SMTP_EMAIL'))
        .subject('Error creating new order')
        .htmlView('emails/orders/error-create-order', {
          locale: i18n.locale,
          appName,
          appDomain,
          currentYear,
          userEmail,
          currentDate,
          errorMsg,
          braintreeTransactionId,
          shipping,
          products,
        })
    })
  }

  public static async sendErrorGetOrderEmail(
    i18n: I18nContract,
    appName: string,
    appDomain: string,
    errorMsg: string,
    order: Order
  ) {
    const currentYear = new Date().getFullYear()
    const currentDate = new Date().toLocaleDateString()
    Mail.send((message) => {
      message
        .from(Env.get('SMTP_EMAIL'))
        .to(Env.get('SMTP_EMAIL'))
        .subject('Error sending new order email')
        .htmlView('emails/orders/error-get-order-email', {
          locale: i18n.locale,
          appName,
          appDomain,
          currentYear,
          currentDate,
          errorMsg,
          order,
        })
    })
  }
}
