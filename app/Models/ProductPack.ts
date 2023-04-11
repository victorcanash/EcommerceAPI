import {
  column,
  manyToMany,
  ManyToMany,
  computed,
  beforeFetch,
  beforeFind,
  afterCreate,
  afterUpdate,
  ModelQueryBuilderContract,
} from '@ioc:Adonis/Lucid/Orm'

import NP from 'number-precision'

import ProductBaseModel from 'App/Models/ProductBaseModel'
import ProductInventory from 'App/Models/ProductInventory'

export default class ProductPack extends ProductBaseModel {
  @column()
  public price: number

  @column()
  public rating: string

  @manyToMany(() => ProductInventory, {
    pivotTable: 'product_packs_inventories',
    pivotTimestamps: true,
    localKey: 'id',
    pivotForeignKey: 'pack_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'inventory_id',
  })
  public inventories: ManyToMany<typeof ProductInventory>

  @computed()
  public get inventoriesIds() {
    if (this.inventories && this.inventories.length > 0) {
      return this.inventories.map((item) => {
        return item.id
      })
    }
    return []
  }

  @computed()
  public get quantity() {
    let quantity: number | undefined
    this.inventories.forEach((item) => {
      if (!quantity || item.quantity < quantity) {
        quantity = item.quantity
      }
    })
    return quantity || 0
  }

  @computed()
  public get originalPrice() {
    return this.getOriginalPrice()
  }

  @computed()
  public get discountPercent() {
    const originalPrice = this.getOriginalPrice()
    const decreaseValue = originalPrice - this.price
    const discountPercent = NP.round(
      NP.times(NP.divide(decreaseValue, this.getOriginalPrice()), 100),
      2
    )
    return discountPercent
  }

  private getOriginalPrice() {
    let originalPrice = 0
    this.inventories.forEach((item) => {
      originalPrice = NP.plus(originalPrice, item.realPrice)
    })
    return NP.round(originalPrice, 2)
  }

  @beforeFetch()
  public static beforeFetch(query: ModelQueryBuilderContract<typeof ProductPack>) {
    this.loadPackDataQuery(query)
  }

  @beforeFind()
  public static async onFind(query: ModelQueryBuilderContract<typeof ProductPack>) {
    this.loadPackDataQuery(query)
  }

  @afterCreate()
  public static async onCreate(model: ProductPack) {
    await this.loadPackDataModel(model)
  }

  @afterUpdate()
  public static async onUpdate(model: ProductPack) {
    await this.loadPackDataModel(model)
  }

  private static async loadPackDataQuery(query: ModelQueryBuilderContract<typeof ProductPack>) {
    query.preload('inventories')
  }

  private static async loadPackDataModel(model: ProductPack) {
    await model.load('inventories')
  }
}
