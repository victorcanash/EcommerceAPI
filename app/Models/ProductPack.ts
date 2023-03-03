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

import ProductBaseModel from 'App/Models/ProductBaseModel'
import ProductInventory from 'App/Models/ProductInventory'

export default class ProductPack extends ProductBaseModel {
  @column()
  public price: number

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
    let originalPrice = 0
    this.inventories.forEach((item) => {
      originalPrice += item.realPrice
    })
    return originalPrice
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
