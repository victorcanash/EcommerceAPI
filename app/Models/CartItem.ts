import { column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'

import AppBaseModel from 'App/Models/AppBaseModel'
import Cart from 'App/Models/Cart'
import Product from 'App/Models/Product'
import ProductInventory from 'App/Models/ProductInventory'

export default class CartItem extends AppBaseModel {
  @column()
  public cartId: number

  @column()
  public productId: number

  @column()
  public inventoryId: number

  @column()
  public quantity: number

  @belongsTo(() => Cart)
  public cart: BelongsTo<typeof Cart>

  @belongsTo(() => Product)
  public product: BelongsTo<typeof Product>

  @belongsTo(() => ProductInventory)
  public inventory: BelongsTo<typeof ProductInventory>
}
