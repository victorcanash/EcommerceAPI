import Hash from '@ioc:Adonis/Core/Hash'
import { column, beforeSave } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'

import AppBaseModel from 'App/Models/AppBaseModel'

export default class GuestUser extends AppBaseModel {
  @column()
  public email: string

  @column()
  public emailVerifiedAt?: DateTime

  @column()
  public rememberMeToken?: string

  @column({ serializeAs: null })
  public password: string

  @beforeSave()
  public static async hashPassword(guestUser: GuestUser) {
    if (guestUser.$dirty.password) {
      guestUser.password = await Hash.make(guestUser.password)
    }
  }
}
