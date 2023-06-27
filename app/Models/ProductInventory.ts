import {
  column,
  belongsTo,
  BelongsTo,
  computed,
  ModelQueryBuilderContract,
  manyToMany,
  ManyToMany,
  scope,
} from '@ioc:Adonis/Lucid/Orm'

import NP from 'number-precision'

import TextsBaseModel from 'App/Models/TextsBaseModel'
import Product from 'App/Models/Product'
import ProductPack from 'App/Models/ProductPack'

export default class ProductInventory extends TextsBaseModel {
  @column()
  public productId: number

  @column()
  public sku: string

  @column()
  public price: number

  @column()
  public quantity: number

  @column()
  public image?: string

  @column()
  public metaId?: string

  @belongsTo(() => Product)
  public product: BelongsTo<typeof Product>

  @manyToMany(() => ProductPack, {
    pivotTable: 'product_packs_inventories',
    pivotTimestamps: true,
    localKey: 'id',
    pivotForeignKey: 'inventory_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'pack_id',
  })
  public packs: ManyToMany<typeof ProductPack>

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

  public static getProductData = scope(
    (
      query: ModelQueryBuilderContract<typeof ProductInventory, ProductInventory>,
      landingData?: boolean
    ) => {
      query.preload('product', (query) => {
        query.preload('activeDiscount')
        if (landingData) {
          query.preload('landing')
        }
      })
    }
  )
}
