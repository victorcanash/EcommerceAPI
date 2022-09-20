import Hash from '@ioc:Adonis/Core/Hash'
import { column, beforeSave, hasMany, HasMany, hasOne, HasOne } from '@ioc:Adonis/Lucid/Orm'
import Mail from '@ioc:Adonis/Addons/Mail'
import Env from '@ioc:Adonis/Core/Env'
import { DateTime } from 'luxon'

import AppBaseModel from 'App/Models/AppBaseModel'
import { Roles } from 'App/Models/Enums/Roles'
import UserAddress from 'App/Models/UserAddress'
import UserPayment from 'App/Models/UserPayment'
import Cart from 'App/Models/Cart'

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

  @hasMany(() => UserAddress)
  public addresses: HasMany<typeof UserAddress>

  @hasMany(() => UserPayment)
  public payments: HasMany<typeof UserPayment>

  @hasOne(() => Cart)
  public cart: HasOne<typeof Cart>

  @beforeSave()
  public static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await Hash.make(user.password)
    }
  }

  public async sendActivationEmail(appName: string, appDomain: string, url: string) {
    const currentYear = new Date().getFullYear()
    Mail.send((message) => {
      message
        .from(Env.get('DEFAULT_FROM_EMAIL'))
        .to(this.email)
        .subject('Please verify your email')
        .htmlView('emails/auth/activate', { user: this, appName, appDomain, url, currentYear })
    })
  }

  public async sendResetEmail(appName: string, appDomain: string, url: string) {
    const currentYear = new Date().getFullYear()
    Mail.send((message) => {
      message
        .from(Env.get('DEFAULT_FROM_EMAIL'))
        .to(this.email)
        .subject('Please add your new password')
        .htmlView('emails/auth/update-password', {
          user: this,
          appName,
          appDomain,
          url,
          currentYear,
        })
    })
  }

  public async sendUpdateEmail(
    appName: string,
    appDomain: string,
    url: string,
    email: string,
    revert = false
  ) {
    const currentYear = new Date().getFullYear()
    const template = revert ? 'emails/auth/revert-update-email' : 'emails/auth/update-email'
    const subject = revert ? 'Revert your new email' : 'Please verify your new email'
    Mail.send((message) => {
      message
        .from(Env.get('DEFAULT_FROM_EMAIL'))
        .to(email)
        .subject(subject)
        .htmlView(template, { user: this, appName, appDomain, url, currentYear })
    })
  }
}
