import { column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'

import TextsBaseModel from 'App/Models/TextsBaseModel'
import Product from 'App/Models/Product'

export default class ProductCategory extends TextsBaseModel {
  @column()
  public image?: string

  @hasMany(() => Product)
  public products: HasMany<typeof Product>
}
