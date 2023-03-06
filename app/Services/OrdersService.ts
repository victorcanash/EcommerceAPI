import { I18nContract } from '@ioc:Adonis/Addons/I18n'

import Order from 'App/Models/Order'
import User from 'App/Models/User'
import Cart from 'App/Models/Cart'
import CartsService from 'App/Services/CartsService'
import BigbuyService from 'App/Services/BigbuyService'
import MailService from 'App/Services/MailService'
import { GuestUserCheckout } from 'App/Types/user'
import { GuestCartCheck } from 'App/Types/cart'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'
import InternalServerException from 'App/Exceptions/InternalServerException'

export default class OrdersService {
  public static async createOrder(
    i18n: I18nContract,
    appName: string,
    appDomain: string,
    user: User | GuestUserCheckout,
    guestUserId: number | undefined,
    cart: Cart | GuestCartCheck,
    braintreeTransactionId: string | undefined,
    paypalTransactionId: string | undefined
  ) {
    const guestCartItems = await CartsService.convertToGuestCartItems(cart)
    const order = await Order.create({
      userId: (user as User)?.id || undefined,
      guestUserId: guestUserId,
      braintreeTransactionId: braintreeTransactionId,
      paypalTransactionId: paypalTransactionId,
      products: guestCartItems,
    })
    const { cartItemIds, orderProducts } = await BigbuyService.createOrderProducts(cart)
    await CartsService.onBuyItems(cart)
    if ((cart as Cart)?.id) {
      await CartsService.deleteItemsByIds(cartItemIds)
    }

    try {
      const bigbuyId = await BigbuyService.createOrder(
        order.id.toString(),
        user.email,
        user.shipping,
        orderProducts
      )
      order.merge({ bigbuyId })
      await order.save()
    } catch (error) {
      await order.delete()
      await MailService.sendErrorCreateOrderEmail(
        i18n,
        appName,
        appDomain,
        user.email,
        user.shipping,
        error.message,
        braintreeTransactionId,
        paypalTransactionId,
        cart
      )
      throw new InternalServerException('Create bigbuy order error')
    }

    try {
      await order.loadItemsData()
      await order.loadBigbuyData()
      await order.loadPaymentData()
      await MailService.sendCheckOrderEmail(
        i18n,
        appName,
        appDomain,
        user.email,
        (user as User)?.firstName ? (user as User).firstName : user.shipping.firstName,
        order
      )
    } catch (error) {
      await MailService.sendErrorGetOrderEmail(i18n, appName, appDomain, error.message, order)
      throw new InternalServerException('Get order info error')
    }

    return order
  }

  public static async getOrderById(
    id: number,
    itemsData: boolean,
    bigbuyData = false,
    paymentData = false
  ) {
    return this.getOrderByField('id', id, itemsData, bigbuyData, paymentData)
  }

  public static async getOrderByBigbuyId(
    bigbuyId: string,
    itemsData: boolean,
    bigbuyData = false,
    paymentData = false
  ) {
    return this.getOrderByField('bigbuyId', bigbuyId, itemsData, bigbuyData, paymentData)
  }

  private static async getOrderByField(
    field: string,
    value: string | number,
    itemsData: boolean,
    bigbuyData = false,
    paymentData = false
  ) {
    let order: Order | null = null
    order = await Order.query().where(field, value).first()
    if (!order) {
      throw new ModelNotFoundException(`Invalid ${field} ${value} getting order`)
    }
    if (itemsData) {
      await order.loadItemsData()
    }
    if (bigbuyData) {
      await order.loadBigbuyData()
    }
    if (paymentData) {
      await order.loadPaymentData()
    }
    return order
  }
}
