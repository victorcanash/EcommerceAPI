import { column } from '@ioc:Adonis/Lucid/Orm'

import AppBaseModel from 'App/Models/AppBaseModel'

export default class Order extends AppBaseModel {
  @column()
  public userId: number

  @column()
  public paypalOrderId: string

  @column()
  public bigbuyOrderId: string
}
