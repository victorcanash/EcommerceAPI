import { column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'

import { AddressTypes, CountryOptions } from 'App/constants/addresses'
import AppBaseModel from 'App/Models/AppBaseModel'
import User from 'App/Models/User'

export default class UserAddress extends AppBaseModel {
  @column()
  public userId: number

  @column()
  public type: AddressTypes

  @column()
  public firstName: string

  @column()
  public lastName: string

  @column()
  public addressLine1: string

  @column()
  public addressLine2?: string

  @column()
  public postalCode: string

  @column()
  public locality: string

  @column()
  public country: CountryOptions

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>
}
