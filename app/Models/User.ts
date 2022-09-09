import Hash from '@ioc:Adonis/Core/Hash'
import { column, beforeSave, hasMany, HasMany, hasOne, HasOne } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'

import AppBaseModel from 'App/Models/AppBaseModel'
import { Roles } from 'App/Models/Enums/Roles'
import UserAddress from 'App/Models/UserAddress'
import UserPayment from 'App/Models/UserPayment'
import Cart from 'App/Models/Cart'

export default class User extends AppBaseModel {
  @column()
  public email: string

  @column({ serializeAs: null })
  public password: string

  @column()
  public rememberMeToken?: string

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
}
