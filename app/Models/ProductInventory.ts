import {
  column,
  belongsTo,
  BelongsTo,
  computed,
  beforeFetch,
  ModelQueryBuilderContract,
} from '@ioc:Adonis/Lucid/Orm'

import NP from 'number-precision'

import ProductBaseModel from 'App/Models/ProductBaseModel'
import Product from 'App/Models/Product'

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

  @computed()
  public get realPrice() {
    if (this.product?.activeDiscount) {
      const discount = NP.times(
        NP.divide(this.product.activeDiscount.discountPercent, 100),
        this.price
      )
      return NP.round(NP.minus(this.price, discount), 2)
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
