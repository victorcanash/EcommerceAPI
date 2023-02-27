import {
  column,
  manyToMany,
  ManyToMany,
  computed,
  beforeFetch,
  ModelQueryBuilderContract,
} from '@ioc:Adonis/Lucid/Orm'

import ProductBaseModel from 'App/Models/ProductBaseModel'
import ProductInventory from 'App/Models/ProductInventory'

export default class ProductPack extends ProductBaseModel {
  @column()
  public price: number

  @manyToMany(() => ProductInventory, {
    pivotTable: 'product_packs_inventories',
    pivotForeignKey: 'pack_id',
    pivotRelatedForeignKey: 'inventory_id',
  })
  public inventories: ManyToMany<typeof ProductInventory>

  @computed()
  public get quantity() {
    let quantity = 0
    this.inventories.forEach((item) => {
      quantity = item.quantity > quantity ? item.quantity : quantity
    })
    return quantity
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
    query.preload('inventories')
  }
}
