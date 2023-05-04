import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import I18n, { I18nContract } from '@ioc:Adonis/Addons/I18n'

import Order from 'App/Models/Order'
import User from 'App/Models/User'
import GuestUser from 'App/Models/GuestUser'
import Cart from 'App/Models/Cart'
import { OrderBigbuyProduct } from 'App/Types/order'
import { CheckoutData } from 'App/Types/checkout'
import { GuestCart, GuestCartCheck } from 'App/Types/cart'
import UsersService from 'App/Services/UsersService'
import CartsService from 'App/Services/CartsService'
import PaymentsService from 'App/Services/PaymentsService'
import BigbuyService from 'App/Services/BigbuyService'
import MailService from 'App/Services/MailService'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'
import InternalServerException from 'App/Exceptions/InternalServerException'
import PermissionException from 'App/Exceptions/PermissionException'
import BadRequestException from 'App/Exceptions/BadRequestException'

export default class OrdersService {
  private static async getOrderByField(
    field: string,
    value: string | number,
    itemsData: boolean,
    bigbuyData = false,
    paymentData = false,
    trackingData = false
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
      await order.loadBigbuyData(trackingData)
    }
    if (paymentData) {
      await order.loadPaymentData()
    }
    return order
  }

  private static async createOrder(
    i18n: I18nContract,
    checkoutData: CheckoutData,
    user: User | undefined,
    guestUser: GuestUser | undefined,
    cart: Cart | GuestCartCheck,
    paypalTransactionId: string,
    currency: string,
    sendCreateOrderEmail: boolean
  ) {
    let order: Order | undefined
    let orderProducts: OrderBigbuyProduct[] = []

    // Create order
    try {
      const guestCartItems = await CartsService.convertToGuestCartItems(cart)
      order = await Order.create({
        userId: user?.id || undefined,
        guestUserId: guestUser?.id || undefined,
        paypalTransactionId: paypalTransactionId,
        products: JSON.stringify(guestCartItems),
        notes: checkoutData.notes,
      })
      orderProducts = await BigbuyService.createOrderProducts(cart)
      await order.loadItemsData()
    } catch (error) {
      const errorMsg = `Create order error: ${error.message}`
      await order?.delete()
      if (sendCreateOrderEmail) {
        await MailService.sendErrorCreateOrderEmail(
          i18n,
          errorMsg,
          checkoutData,
          paypalTransactionId,
          cart,
          currency
        )
        return
      } else {
        throw new InternalServerException(errorMsg)
      }
    }

    // Load payment data
    try {
      await order.loadPaymentData()
    } catch (error) {
      const errorMsg = `Get payment data error: ${error.message}`
      await order?.delete()
      if (sendCreateOrderEmail) {
        await MailService.sendErrorCreateOrderEmail(
          i18n,
          errorMsg,
          checkoutData,
          paypalTransactionId,
          cart,
          currency
        )
        return
      } else {
        throw new InternalServerException(errorMsg)
      }
    }

    // Create Bigbuy order
    try {
      const bigbuyId = await BigbuyService.createOrder(
        order.id.toString(),
        checkoutData.email,
        checkoutData.shipping,
        orderProducts,
        checkoutData.notes
      )
      order.merge({ bigbuyId })
      await order.save()
    } catch (error) {
      const errorMsg = `Create bigbuy order error: ${error.message}`
      await order.delete()
      if (sendCreateOrderEmail) {
        await MailService.sendErrorCreateOrderEmail(
          i18n,
          errorMsg,
          checkoutData,
          paypalTransactionId,
          cart,
          currency
        )
        return
      } else {
        throw new InternalServerException(errorMsg)
      }
    }

    // Send check order email
    try {
      await order.loadBigbuyData()
      await MailService.sendCheckOrderEmail(
        i18n,
        checkoutData.email,
        user?.firstName || checkoutData.shipping.firstName,
        order,
        currency
      )
    } catch (error) {
      const errorMsg = `Send check order email error: ${error.message}`
      await MailService.sendErrorGetOrderEmail(i18n, errorMsg, order, currency)
    }

    return order
  }

  public static async getOrderById(
    id: number,
    itemsData: boolean,
    bigbuyData = false,
    paymentData = false,
    trackingData = false
  ) {
    return this.getOrderByField('id', id, itemsData, bigbuyData, paymentData, trackingData)
  }

  public static async getOrderByBigbuyId(
    bigbuyId: string,
    itemsData: boolean,
    bigbuyData = false,
    paymentData = false,
    trackingData = false
  ) {
    return this.getOrderByField(
      'bigbuyId',
      bigbuyId,
      itemsData,
      bigbuyData,
      paymentData,
      trackingData
    )
  }

  public static async showOrder(
    ctx: HttpContextContract,
    id?: number,
    bigbuyId?: string,
    guestUserEmail?: string
  ) {
    const validToken = await ctx.auth.use('api').check()
    let order: Order | undefined
    if (validToken) {
      order = await this.getOrderById(id || -1, true, true, true, true)
      await ctx.bouncer.with('OrderPolicy').authorize('view', order)
    } else {
      order = await this.getOrderByBigbuyId(bigbuyId || '', true, true, true, true)
      if (order.userId) {
        throw new PermissionException('You have to be logged to get this order')
      }
      const guestUser = await UsersService.getGuestUserByEmail(guestUserEmail || '')
      if (guestUser.id !== order.guestUserId) {
        throw new BadRequestException('Bigbuy id does not pertain to the email sent')
      }
    }
    return order
  }

  public static async createOrderByPayment(
    i18n: I18nContract,
    checkoutData: CheckoutData,
    user: User | undefined,
    guestUser: GuestUser | undefined,
    cart: Cart | GuestCartCheck,
    paypalTransactionId: string,
    currency: string
  ) {
    const order = await this.createOrder(
      i18n,
      checkoutData,
      user,
      guestUser,
      cart,
      paypalTransactionId,
      currency,
      true
    )
    return order
  }

  public static async createOrderByAdminRoute(
    locale: string,
    checkoutData: CheckoutData,
    cart: GuestCart,
    paypalTransactionId: string,
    currency: string
  ) {
    const { user, guestUser, cartCheck } = await PaymentsService.checkAdminPaymentData(
      checkoutData,
      cart
    )
    const order = await this.createOrder(
      I18n.locale(locale),
      checkoutData,
      user,
      guestUser,
      cartCheck,
      paypalTransactionId,
      currency,
      false
    )
    return order
  }
}
