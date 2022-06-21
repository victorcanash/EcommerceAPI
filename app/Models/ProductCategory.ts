import { column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'

import AppBaseModel from 'App/Models/AppBaseModel'
import Product from 'App/Models/Product'

export default class ProductCategory extends AppBaseModel {
  @column()
  public name: string

  @column()
  public description: string

  @hasMany(() => Product)
  public products: HasMany<typeof Product>
}
