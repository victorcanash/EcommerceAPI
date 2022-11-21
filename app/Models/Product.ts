import {
  column,
  belongsTo,
  BelongsTo,
  hasMany,
  HasMany,
  hasOne,
  HasOne,
  computed,
  ModelQueryBuilderContract,
  scope,
} from '@ioc:Adonis/Lucid/Orm'

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

  @hasMany(() => ProductInventory, {
    onQuery: (query) => {
      query.orderBy('id', 'asc')
    },
  })
  public inventories: HasMany<typeof ProductInventory>

  @hasMany(() => ProductDiscount, {
    onQuery: (query) => {
      query.orderBy('id', 'asc')
    },
  })
  public discounts: HasMany<typeof ProductDiscount>

  @hasOne(() => ProductDiscount, {
    onQuery: (query) => {
      query.where('active', true).orderBy('id', 'desc')
    },
  })
  public activeDiscount: HasOne<typeof ProductDiscount>

  @computed()
  public get lowestPrice() {
    let price = 0
    if (this.inventories) {
      this.inventories.forEach((item, index) => {
        if (item.price < price || index === 0) {
          price = item.price
        }
      })
    }
    return price
  }

  @computed()
  public get lowestRealPrice() {
    let price = 0
    if (this.inventories) {
      this.inventories.forEach((item, index) => {
        if (item.realPrice < price || index === 0) {
          price = item.realPrice
        }
      })
    }
    return price
  }

  public static filter = scope(
    (
      query: ModelQueryBuilderContract<typeof Product, Product>,
      keywords: string,
      categoryName: string | null
    ) => {
      query
        .where((query) => {
          query
            .where('name', 'ILIKE', `%${keywords}%`)
            .orWhere('description', 'ILIKE', `%${keywords}%`)
            .orWhereHas('category', (query) => {
              query
                .where('name', 'ILIKE', `%${keywords}%`)
                .orWhere('description', 'ILIKE', `%${keywords}%`)
            })
        })
        .whereHas('category', (query) => {
          if (categoryName) {
            query.where('name', categoryName)
          }
        })
    }
  )

  public static getAllData = scope((query: ModelQueryBuilderContract<typeof Product, Product>) => {
    query.preload('inventories').preload('activeDiscount')
  })

  public static getAdminData = scope(
    (query: ModelQueryBuilderContract<typeof Product, Product>) => {
      query.preload('discounts')
    }
  )
}
