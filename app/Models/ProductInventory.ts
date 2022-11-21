import {
  column,
  belongsTo,
  BelongsTo,
  computed,
  beforeFetch,
  ModelQueryBuilderContract,
} from '@ioc:Adonis/Lucid/Orm'

import AppBaseModel from 'App/Models/AppBaseModel'
import Product from 'App/Models/Product'
import BigbuyService from 'App/Services/BigbuyService'
import { roundTwoDecimals } from 'App/Utils/numbers'
import Logger from '@ioc:Adonis/Core/Logger'

export default class ProductInventory extends AppBaseModel {
  @column()
  public productId: number

  @column()
  public sku: string

  @column()
  public name: string

  @column()
  public description: string

  @column()
  public price: number

  @belongsTo(() => Product)
  public product: BelongsTo<typeof Product>

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
    id: 0,
    name: '',
    description: '',
    price: 0,
    quantity: 0,
  }

  public async loadBigbuyData() {
    if (this.bigbuyData.id <= 0) {
      const { id, name, description, price } = await BigbuyService.getProductInfo(this.sku)
      const quantity = await BigbuyService.getProductQuantity(id)
      this.bigbuyData = {
        id: id,
        name: name,
        description: description,
        price: price,
        quantity: quantity,
      }
    }
    Logger.error(JSON.stringify(this.bigbuyData))
  }

  @beforeFetch()
  public static beforeFetch(query: ModelQueryBuilderContract<typeof ProductInventory>) {
    query.preload('product', (query) => {
      query.preload('activeDiscount')
    })
  }
}
