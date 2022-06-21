import { column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'

import AppBaseModel from 'App/Models/AppBaseModel'
import Product from 'App/Models/Product'

export default class ProductDiscount extends AppBaseModel {
  @column()
  public name: string

  @column()
  public description: string

  @column()
  public discountPercent: number

  @column()
  public active: boolean

  @belongsTo(() => Product)
  public product: BelongsTo<typeof Product>
}
