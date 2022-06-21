import { column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'

import AppBaseModel from 'App/Models/AppBaseModel'
import Product from 'App/Models/Product'

export default class ProductInventory extends AppBaseModel {
  @column()
  public quantity: number

  @column()
  public size?: string

  @belongsTo(() => Product)
  public product: BelongsTo<typeof Product>
}
