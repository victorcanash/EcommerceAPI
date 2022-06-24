import Hash from '@ioc:Adonis/Core/Hash'
import { column, beforeSave, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'

import AppBaseModel from 'App/Models/AppBaseModel'
import { Roles } from 'App/Models/Enums/Roles'
import UserAddress from 'App/Models/UserAddress'

export default class User extends AppBaseModel {
  @column()
  public email: string

  @column({ serializeAs: null })
  public password: string

  @column()
  public rememberMeToken?: string

  @column()
  public role: Roles

  @column()
  public firstName: string

  @column()
  public lastName: string

  @column()
  public age: number

  @column()
  public lockedOut: boolean

  @hasMany(() => UserAddress)
  public addresses: HasMany<typeof UserAddress>

  @beforeSave()
  public static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await Hash.make(user.password)
    }
  }
}
