import { column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'

import AppBaseModel from 'App/Models/AppBaseModel'
import User from 'App/Models/User'

export default class UserPayment extends AppBaseModel {
  @column()
  public userId: number

  @column()
  public type: string

  @column()
  public provider: string

  @column()
  public accountNumber: string

  @column()
  public expiry: DateTime

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>
}
