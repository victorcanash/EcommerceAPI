import { column, computed } from '@ioc:Adonis/Lucid/Orm'

import AppBaseModel from 'App/Models/AppBaseModel'
import ProductInventory from 'App/Models/ProductInventory'
import ProductPack from 'App/Models/ProductPack'

export default class ProductReview extends AppBaseModel {
  @column()
  public userId?: number

  @column()
  public guestUserId?: number

  @column()
  public inventoryId?: number

  @column()
  public packId?: number

  @column()
  public rating: number

  @column()
  public title: string

  @column()
  public description: string

  @column()
  public email: string

  @column()
  public publicName: string

  @column()
  public imageUrl?: string

  @computed()
  public get inventory() {
    return this.inventoryData
  }

  public inventoryData: ProductInventory | undefined

  @computed()
  public get pack() {
    return this.packData
  }

  public packData: ProductPack | undefined
}
