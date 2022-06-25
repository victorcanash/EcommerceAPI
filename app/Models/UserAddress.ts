import { column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'

import AppBaseModel from 'App/Models/AppBaseModel'
import User from 'App/Models/User'

export default class UserAddress extends AppBaseModel {
  @column()
  public userId: number

  @column()
  public addressLine: string

  @column()
  public additionalInfo: string

  @column()
  public postalCode: string

  @column()
  public locality: string

  @column()
  public administrativeArea: string

  @column()
  public country: string

  @column()
  public type?: string

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>
}
