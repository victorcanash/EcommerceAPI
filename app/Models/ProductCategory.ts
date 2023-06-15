import { BelongsTo, belongsTo, column, ManyToMany, manyToMany } from '@ioc:Adonis/Lucid/Orm'

import TextsBaseModel from 'App/Models/TextsBaseModel'
import Product from 'App/Models/Product'
import ProductCategoryGroup from 'App/Models/ProductCategoryGroup'

export default class ProductCategory extends TextsBaseModel {
  @column()
  public categoryGroupId?: number

  @column()
  public slug: string

  @column()
  public image?: string

  @belongsTo(() => ProductCategoryGroup)
  public categoryGroup: BelongsTo<typeof ProductCategoryGroup>

  @manyToMany(() => Product, {
    pivotTable: 'product_categories_products',
    pivotTimestamps: true,
    localKey: 'id',
    pivotForeignKey: 'category_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'product_id',
  })
  public products: ManyToMany<typeof Product>
}
