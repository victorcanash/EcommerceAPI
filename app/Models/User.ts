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
import { DateTime } from 'luxon'

import { Roles } from 'App/Constants/Auth'
import AppBaseModel from 'App/Models/AppBaseModel'
import UserAddress from 'App/Models/UserAddress'
import Cart from 'App/Models/Cart'
import Order from 'App/Models/Order'
import { AddressTypes } from 'App/Constants/Addresses'

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

  public async sendActivationEmail(appName: string, appDomain: string, btnUrl: string) {
    const currentYear = new Date().getFullYear()
    Mail.send((message) => {
      message
        .from(Env.get('DEFAULT_FROM_EMAIL'))
        .to(this.email)
        .subject('Please verify your email')
        .htmlView('emails/auth', {
          appName,
          appDomain,
          currentYear,
          user: this,
          description: 'Click below to activate your account.',
          btnTxt: 'Verify Account',
          btnUrl,
        })
    })
  }

  public async sendResetPswEmail(appName: string, appDomain: string, btnUrl: string) {
    const currentYear = new Date().getFullYear()
    Mail.send((message) => {
      message
        .from(Env.get('DEFAULT_FROM_EMAIL'))
        .to(this.email)
        .subject('Please add your new password')
        .htmlView('emails/auth', {
          appName,
          appDomain,
          currentYear,
          user: this,
          description: 'Click below to add your new password.',
          btnTxt: 'Update Password',
          btnUrl,
        })
    })
  }

  public async sendUpdateEmail(
    appName: string,
    appDomain: string,
    btnUrl: string,
    email: string,
    revert = false
  ) {
    const currentYear = new Date().getFullYear()
    const subject = revert ? 'Revert your new email' : 'Please verify your new email'
    const description = revert
      ? 'Click below to revert your new email.'
      : 'Click below to confirm your new email.'
    const btnTxt = revert ? 'Revert New Email' : 'Update Email'
    Mail.send((message) => {
      message
        .from(Env.get('DEFAULT_FROM_EMAIL'))
        .to(email)
        .subject(subject)
        .htmlView('emails/auth', {
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

  public async sendCheckOrderEmail(appName: string, appDomain: string, order: Order) {
    const currentYear = new Date().getFullYear()
    Mail.send((message) => {
      message
        .from(Env.get('DEFAULT_FROM_EMAIL'))
        .to(this.email)
        .subject('Please check your order')
        .htmlView('emails/orders/check-order', {
          appName,
          appDomain,
          currentYear,
          user: this,
          order,
        })
    })
  }

  public async sendErrorGetOrderEmail(appName: string, appDomain: string, order: Order) {
    const currentYear = new Date().getFullYear()
    Mail.send((message) => {
      message
        .from(Env.get('DEFAULT_FROM_EMAIL'))
        .to(Env.get('DEFAULT_FROM_EMAIL'))
        .subject('Error getting an order')
        .htmlView('emails/orders/error-get-order', {
          appName,
          appDomain,
          currentYear,
          user: this,
          order,
        })
    })
  }

  public async sendErrorCreateOrderEmail(
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
        .from(Env.get('DEFAULT_FROM_EMAIL'))
        .to(Env.get('DEFAULT_FROM_EMAIL'))
        .subject('Error creating an order')
        .htmlView('emails/orders/error-create-order', {
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
}
