import { column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'

import TextsBaseModel from 'App/Models/TextsBaseModel'
import ProductCategory from 'App/Models/ProductCategory'

export default class ProductCategoryGroup extends TextsBaseModel {
  @column()
  public slug: string

  @column()
  public image?: string

  @hasMany(() => ProductCategory, {
    foreignKey: 'categoryGroupId',
    localKey: 'id',
    onQuery: (query) => {
      query.orderBy('id', 'asc')
    },
  })
  public categories: HasMany<typeof ProductCategory>
}
