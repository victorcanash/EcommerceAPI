import { column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'

import AppBaseModel from 'App/Models/AppBaseModel'
import { OrderStatus } from 'App/Models/Enums/OrderStatus'
import OrderItem from 'App/Models/OrderItem'

export default class Order extends AppBaseModel {
  @column()
  public status: OrderStatus

  @column()
  public sessionId: string

  @column()
  public deliveredDate?: DateTime

  @column()
  public customerEmail: string
  @column()
  public customerPhone: string

  @column()
  public amountDiscount: number
  @column()
  public amountShipping: number
  @column()
  public amountSubtotal: number
  @column()
  public amountTotal: number
  @column()
  public currency: string

  @column()
  public shippingName: string
  @column()
  public shippingCity: string
  @column()
  public shippingCountry: string
  @column()
  public shippingLine1: string
  @column()
  public shippingLine2?: string
  @column()
  public shippingPostalCode: string
  @column()
  public shippingState: string

  @column()
  public paymentType: string

  @column()
  public last4digits?: string

  @column()
  public billingName: string
  @column()
  public billingCity: string
  @column()
  public billingCountry: string
  @column()
  public billingLine1: string
  @column()
  public billingLine2?: string
  @column()
  public billingPostalCode: string
  @column()
  public billingState: string

  @hasMany(() => OrderItem)
  public items: HasMany<typeof OrderItem>
}
