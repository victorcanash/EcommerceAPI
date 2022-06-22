import { column, belongsTo, BelongsTo, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'

import AppBaseModel from 'App/Models/AppBaseModel'
import ProductCategory from 'App/Models/ProductCategory'
import ProductInventory from 'App/Models/ProductInventory'
import ProductDiscount from 'App/Models/ProductDiscount'

export default class Product extends AppBaseModel {
  @column()
  public categoryId: number

  @column()
  public name: string

  @column()
  public description: string

  @column()
  public sku: string

  @column()
  public price: number

  @belongsTo(() => ProductCategory)
  public category: BelongsTo<typeof ProductCategory>

  @hasMany(() => ProductInventory)
  public inventories: HasMany<typeof ProductInventory>

  @hasMany(() => ProductDiscount)
  public discounts: HasMany<typeof ProductDiscount>
}
