import {
  column,
  belongsTo,
  BelongsTo,
  hasMany,
  HasMany,
  hasOne,
  HasOne,
  computed,
} from '@ioc:Adonis/Lucid/Orm'

import AppBaseModel from 'App/Models/AppBaseModel'
import ProductCategory from 'App/Models/ProductCategory'
import ProductInventory from 'App/Models/ProductInventory'
import ProductDiscount from 'App/Models/ProductDiscount'
import { roundTwoDecimals } from 'App/Utils/numbers'

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

  @column({ serializeAs: null })
  public images: string

  @computed()
  public get imageNames() {
    return this.images ? this.images.split(',') : ([] as string[])
  }

  @belongsTo(() => ProductCategory, {
    foreignKey: 'categoryId',
  })
  public category: BelongsTo<typeof ProductCategory>

  @hasMany(() => ProductInventory)
  public inventories: HasMany<typeof ProductInventory>

  @hasOne(() => ProductDiscount, {
    onQuery: (query) => {
      query.where('active', true).orderBy('id', 'desc').limit(1)
    },
  })
  public activeDiscount: HasOne<typeof ProductDiscount>

  @computed()
  public get realPrice() {
    if (this.activeDiscount) {
      const discount = (this.activeDiscount.discountPercent / 100) * this.price
      return roundTwoDecimals(this.price - discount)
    }
    return this.price
  }
}
