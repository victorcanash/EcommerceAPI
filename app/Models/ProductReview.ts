import { BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'

import AppBaseModel from 'App/Models/AppBaseModel'
import Product from 'App/Models/Product'

export default class ProductReview extends AppBaseModel {
  @column()
  public userId?: number

  @column()
  public guestUserId?: number

  @column()
  public productId: number

  @column()
  public rating: number

  @column()
  public title?: string

  @column()
  public description: string

  @column()
  public email: string

  @column()
  public publicName: string

  @column()
  public imageUrl?: string

  @belongsTo(() => Product)
  public product: BelongsTo<typeof Product>
}
