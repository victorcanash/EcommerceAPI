import {
  column,
  belongsTo,
  BelongsTo,
  ModelQueryBuilderContract,
  beforeFetch,
  afterCreate,
} from '@ioc:Adonis/Lucid/Orm'

import AppBaseModel from 'App/Models/AppBaseModel'
import Cart from 'App/Models/Cart'
import ProductInventory from 'App/Models/ProductInventory'
import ProductPack from 'App/Models/ProductPack'

export default class CartItem extends AppBaseModel {
  @column()
  public cartId: number

  @column()
  public inventoryId?: number

  @column()
  public packId?: number

  @column()
  public quantity: number

  @belongsTo(() => Cart)
  public cart: BelongsTo<typeof Cart>

  @belongsTo(() => ProductInventory, {
    foreignKey: 'inventoryId',
  })
  public inventory: BelongsTo<typeof ProductInventory>

  @belongsTo(() => ProductPack, {
    foreignKey: 'packId',
  })
  public pack: BelongsTo<typeof ProductPack>

  @beforeFetch()
  public static beforeFetch(query: ModelQueryBuilderContract<typeof CartItem>) {
    query.preload('inventory', (query) => {
      query.apply((scopes) => {
        scopes.getProductData(true)
      })
    })
    query.preload('pack', (query) => {
      query.preload('landing')
    })
  }

  @afterCreate()
  public static async onCreate(model: CartItem) {
    if (model.inventoryId) {
      await model.load('inventory', (query) => {
        query.apply((scopes) => {
          scopes.getProductData(true)
        })
      })
    } else if (model.packId) {
      await model.load('pack', (query) => {
        query.preload('landing')
      })
    }
  }
}
