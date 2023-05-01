import { BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'

import AppBaseModel from 'App/Models/AppBaseModel'
import Product from 'App/Models/Product'
import ProductPack from 'App/Models/ProductPack'

export default class ProductReview extends AppBaseModel {
  @column()
  public userId?: number

  @column()
  public guestUserId?: number

  @column()
  public productId?: number

  @column()
  public packId?: number

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

  @belongsTo(() => ProductPack, {
    foreignKey: 'packId',
  })
  public pack: BelongsTo<typeof ProductPack>
}
