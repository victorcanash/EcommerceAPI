import { column } from '@ioc:Adonis/Lucid/Orm'

import AppBaseModel from 'App/Models/AppBaseModel'

export default class OrderItem extends AppBaseModel {
  @column()
  public orderId: number

  @column()
  public name: string

  @column()
  public description: string

  // not foreign key
  @column()
  public productId: number

  @column()
  public unitAmount: number

  @column()
  public quantity: number
}
