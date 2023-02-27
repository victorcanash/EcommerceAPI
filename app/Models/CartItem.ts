import { column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'

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
}
