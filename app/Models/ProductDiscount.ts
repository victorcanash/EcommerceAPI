import { column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'

import TextsBaseModel from 'App/Models/TextsBaseModel'
import Product from 'App/Models/Product'

export default class ProductDiscount extends TextsBaseModel {
  @column()
  public productId: number

  @column()
  public discountPercent: number

  @column()
  public active: boolean

  @belongsTo(() => Product)
  public product: BelongsTo<typeof Product>
}
