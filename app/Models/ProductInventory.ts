import {
  column,
  belongsTo,
  BelongsTo,
  manyToMany,
  ManyToMany,
  computed,
  beforeFetch,
  ModelQueryBuilderContract,
} from '@ioc:Adonis/Lucid/Orm'

import ProductBaseModel from 'App/Models/ProductBaseModel'
import Product from 'App/Models/Product'
import { roundTwoDecimals } from 'App/Utils/numbers'
import ProductPack from './ProductPack'

export default class ProductInventory extends ProductBaseModel {
  @column()
  public productId: number

  @column()
  public sku: string

  @column()
  public price: number

  @column()
  public quantity: number

  @belongsTo(() => Product)
  public product: BelongsTo<typeof Product>

  @manyToMany(() => ProductPack, {
    pivotTable: 'product_packs_inventories',
    pivotForeignKey: 'inventory_id',
    pivotRelatedForeignKey: 'pack_id',
  })
  public packs: ManyToMany<typeof ProductPack>

  @computed()
  public get realPrice() {
    if (this.product?.activeDiscount) {
      const discount = (this.product.activeDiscount.discountPercent / 100) * this.price
      return roundTwoDecimals(this.price - discount)
    }
    return this.price
  }

  @computed()
  public get bigbuy() {
    return this.bigbuyData
  }

  public bigbuyData = {
    id: '',
    name: '',
    description: '',
    price: 0,
    quantity: 0,
  }

  @beforeFetch()
  public static beforeFetch(query: ModelQueryBuilderContract<typeof ProductInventory>) {
    query.preload('product', (query) => {
      query.preload('activeDiscount')
    })
  }
}
