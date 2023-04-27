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

import TextsBaseModel from 'App/Models/TextsBaseModel'
import ProductCategory from 'App/Models/ProductCategory'
import ProductInventory from 'App/Models/ProductInventory'
import ProductDiscount from 'App/Models/ProductDiscount'

export default class Product extends TextsBaseModel {
  @column()
  public categoryId: number

  @column()
  public rating: string

  @column()
  public reviewsCount: number

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
            .whereHas('name', (query) => {
              query.where('en', 'ILIKE', `%${keywords}%`).orWhere('es', 'ILIKE', `%${keywords}%`)
            })
            .orWhereHas('description', (query) => {
              query.where('en', 'ILIKE', `%${keywords}%`).orWhere('es', 'ILIKE', `%${keywords}%`)
            })
            .orWhereHas('category', (query) => {
              query
                .whereHas('name', (query) => {
                  query
                    .where('en', 'ILIKE', `%${keywords}%`)
                    .orWhere('es', 'ILIKE', `%${keywords}%`)
                })
                .orWhereHas('description', (query) => {
                  query
                    .where('en', 'ILIKE', `%${keywords}%`)
                    .orWhere('es', 'ILIKE', `%${keywords}%`)
                })
            })
        })
        .whereHas('category', (query) => {
          if (categoryName) {
            query.whereHas('name', (query) => {
              query.where('en', categoryName).orWhere('es', categoryName)
            })
          }
        })
    }
  )

  public static getInventoriesData = scope(
    (query: ModelQueryBuilderContract<typeof Product, Product>) => {
      query.preload('inventories').preload('activeDiscount')
    }
  )

  public static getVariantsData = scope(
    (query: ModelQueryBuilderContract<typeof Product, Product>) => {
      query.preload('inventories', (query) => {
        query.preload('packs')
      })
    }
  )

  public static getAdminData = scope(
    (query: ModelQueryBuilderContract<typeof Product, Product>) => {
      query.preload('discounts')
    }
  )
}
