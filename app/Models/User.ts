import Hash from '@ioc:Adonis/Core/Hash'
import {
  column,
  beforeSave,
  hasOne,
  HasOne,
  ModelQueryBuilderContract,
  scope,
} from '@ioc:Adonis/Lucid/Orm'
import Mail from '@ioc:Adonis/Addons/Mail'
import Env from '@ioc:Adonis/Core/Env'
import { I18nContract } from '@ioc:Adonis/Addons/I18n'
import { DateTime } from 'luxon'

import { Roles } from 'App/Constants/auth'
import { AddressTypes } from 'App/Constants/addresses'
import AppBaseModel from 'App/Models/AppBaseModel'
import UserAddress from 'App/Models/UserAddress'
import Cart from 'App/Models/Cart'
import Order from 'App/Models/Order'

export default class User extends AppBaseModel {
  @column()
  public email: string

  @column()
  public emailVerifiedAt?: DateTime

  @column({ serializeAs: null })
  public password: string

  @column()
  public rememberMeToken?: string

  @column()
  public isActivated: boolean

  @column({ serializeAs: null })
  public role: Roles

  @column()
  public firstName: string

  @column()
  public lastName: string

  @column()
  public birthday: DateTime

  @column()
  public getEmails: boolean

  @column()
  public lockedOut: boolean

  @column()
  public braintreeId: string

  @hasOne(() => Cart)
  public cart: HasOne<typeof Cart>

  @hasOne(() => UserAddress, {
    onQuery: (query) => {
      query.where('type', AddressTypes.SHIPPING).orderBy('id', 'desc')
    },
  })
  public shipping: HasOne<typeof UserAddress>

  @hasOne(() => UserAddress, {
    onQuery: (query) => {
      query.where('type', AddressTypes.BILLING).orderBy('id', 'desc')
    },
  })
  public billing: HasOne<typeof UserAddress>

  @beforeSave()
  public static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await Hash.make(user.password)
    }
  }

  public static getAllData = scope((query: ModelQueryBuilderContract<typeof User, User>) => {
    query
      .preload('cart', (query) => {
        query.preload('items', (query) => {
          query.preload('inventory')
        })
      })
      .preload('shipping')
      .preload('billing')
  })

  public async sendActivationEmail(
    i18n: I18nContract,
    appName: string,
    appDomain: string,
    btnUrl: string
  ) {
    const currentYear = new Date().getFullYear()
    Mail.send((message) => {
      message
        .from(Env.get('SMTP_EMAIL'))
        .to(this.email)
        .subject(i18n.formatMessage('messages.emails.auth.activation.subject'))
        .htmlView('emails/auth', {
          i18n,
          appName,
          appDomain,
          currentYear,
          user: this,
          description: i18n.formatMessage('messages.emails.auth.activation.description'),
          btnTxt: i18n.formatMessage('messages.emails.auth.activation.button'),
          btnUrl,
        })
    })
  }

  public async sendResetPswEmail(
    i18n: I18nContract,
    appName: string,
    appDomain: string,
    btnUrl: string
  ) {
    const currentYear = new Date().getFullYear()
    Mail.send((message) => {
      message
        .from(Env.get('SMTP_EMAIL'))
        .to(this.email)
        .subject(i18n.formatMessage('messages.emails.auth.resetPsw.subject'))
        .htmlView('emails/auth', {
          i18n,
          appName,
          appDomain,
          currentYear,
          user: this,
          description: i18n.formatMessage('messages.emails.auth.resetPsw.description'),
          btnTxt: i18n.formatMessage('messages.emails.auth.resetPsw.button'),
          btnUrl,
        })
    })
  }

  public async sendUpdateEmail(
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
        user: this,
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

  public async sendCheckOrderEmail(
    i18n: I18nContract,
    appName: string,
    appDomain: string,
    order: Order
  ) {
    const currentYear = new Date().getFullYear()
    Mail.send((message) => {
      message
        .from(Env.get('SMTP_EMAIL'))
        .to(this.email)
        .subject(i18n.formatMessage('messages.emails.checkOrder.subject'))
        .htmlView('emails/orders/check-order', {
          i18n,
          appName,
          appDomain,
          currentYear,
          user: this,
          order,
        })
    })
  }

  public async sendErrorCreateOrderEmail(
    i18n: I18nContract,
    appName: string,
    appDomain: string,
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
          user: this,
          currentDate,
          errorMsg,
          braintreeTransactionId,
          shipping: this.shipping,
          products,
        })
    })
  }

  public async sendErrorGetOrderEmail(
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
          user: this,
          currentDate,
          errorMsg,
          order,
        })
    })
  }
}
