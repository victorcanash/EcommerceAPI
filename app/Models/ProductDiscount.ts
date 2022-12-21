import { column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'

import ProductBaseModel from 'App/Models/ProductBaseModel'
import Product from 'App/Models/Product'

export default class ProductDiscount extends ProductBaseModel {
  @column()
  public productId: number

  @column()
  public discountPercent: number

  @column()
  public active: boolean

  @belongsTo(() => Product)
  public product: BelongsTo<typeof Product>
}
