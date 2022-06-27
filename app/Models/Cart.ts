import { column, belongsTo, BelongsTo, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'

import AppBaseModel from 'App/Models/AppBaseModel'
import User from 'App/Models/User'
import CartItem from 'App/Models/CartItem'

export default class Cart extends AppBaseModel {
  @column()
  public userId: number

  @column()
  public total: number

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @hasMany(() => CartItem)
  public cartItems: HasMany<typeof CartItem>
}
