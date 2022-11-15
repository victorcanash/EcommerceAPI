import { column, belongsTo, BelongsTo, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'

import AppBaseModel from 'App/Models/AppBaseModel'
import User from 'App/Models/User'
import CartItem from 'App/Models/CartItem'

export default class Cart extends AppBaseModel {
  @column()
  public userId: number

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @hasMany(() => CartItem, {
    onQuery: (query) => {
      query.orderBy('id', 'asc')
    },
  })
  public items: HasMany<typeof CartItem>

  public get amount() {
    let amount = 0
    this.items.forEach((item) => {
      const product = item.product.serialize()
      amount += product.realPrice * item.quantity
    })
    return amount
  }
}
