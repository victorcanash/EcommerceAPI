import { hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'

import ProductBaseModel from 'App/Models/ProductBaseModel'
import Product from 'App/Models/Product'

export default class ProductCategory extends ProductBaseModel {
  @hasMany(() => Product)
  public products: HasMany<typeof Product>
}
