import {
  column,
  hasMany,
  HasMany,
  hasOne,
  HasOne,
  computed,
  ModelQueryBuilderContract,
  scope,
  ManyToMany,
  manyToMany,
} from '@ioc:Adonis/Lucid/Orm'

import TextsBaseModel from 'App/Models/TextsBaseModel'
import ProductCategory from 'App/Models/ProductCategory'
import ProductInventory from 'App/Models/ProductInventory'
import ProductDiscount from 'App/Models/ProductDiscount'

export default class Product extends TextsBaseModel {
  @column()
  public landingId: number

  @column()
  public rating: string

  @column()
  public reviewsCount: number

  @manyToMany(() => ProductCategory, {
    pivotTable: 'product_categories_products',
    pivotTimestamps: true,
    localKey: 'id',
    pivotForeignKey: 'product_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'category_id',
  })
  public categories: ManyToMany<typeof ProductCategory>

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
    (query: ModelQueryBuilderContract<typeof Product, Product>, keywords: string) => {
      query.where((query) => {
        query
          .whereHas('name', (query) => {
            query.where('en', 'ILIKE', `%${keywords}%`).orWhere('es', 'ILIKE', `%${keywords}%`)
          })
          .orWhereHas('description', (query) => {
            query.where('en', 'ILIKE', `%${keywords}%`).orWhere('es', 'ILIKE', `%${keywords}%`)
          })
          .orWhereHas('categories', (query) => {
            query
              .whereHas('name', (query) => {
                query.where('en', 'ILIKE', `%${keywords}%`).orWhere('es', 'ILIKE', `%${keywords}%`)
              })
              .orWhereHas('description', (query) => {
                query.where('en', 'ILIKE', `%${keywords}%`).orWhere('es', 'ILIKE', `%${keywords}%`)
              })
          })
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
      query.preload('discounts').preload('categories')
    }
  )
}
