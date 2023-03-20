import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
// import { AuthContract } from '@ioc:Adonis/Addons/Auth'
import I18n, { I18nContract } from '@ioc:Adonis/Addons/I18n'

import Order from 'App/Models/Order'
import User from 'App/Models/User'
import Cart from 'App/Models/Cart'
import { OrderBigbuyProduct } from 'App/Types/order'
import { GuestUserCheckout, GuestUserCheckoutAddress } from 'App/Types/user'
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

  private static async createOrder(
    i18n: I18nContract,
    appName: string,
    appDomain: string,
    user: GuestUserCheckout | User | undefined,
    guestUserId: number | undefined,
    guestUserEmail: string | undefined,
    shipping: GuestUserCheckoutAddress | undefined,
    cart: Cart | GuestCartCheck,
    braintreeTransactionId: string | undefined,
    paypalTransactionId: string | undefined,
    sendCreateOrderEmail: boolean
  ) {
    let order: Order | undefined
    let orderProducts: OrderBigbuyProduct[] = []

    // Create order
    try {
      const guestCartItems = await CartsService.convertToGuestCartItems(cart)
      order = await Order.create({
        userId: (user as User)?.id || undefined,
        guestUserId: guestUserId,
        braintreeTransactionId: braintreeTransactionId,
        paypalTransactionId: paypalTransactionId,
        products: guestCartItems,
      })
      orderProducts = await BigbuyService.createOrderProducts(cart)
      await order.loadItemsData()
    } catch (error) {
      const errorMsg = `Create order error: ${error.message}`
      await order?.delete()
      if (sendCreateOrderEmail) {
        await MailService.sendErrorCreateOrderEmail(
          i18n,
          appName,
          appDomain,
          user?.email || '',
          user?.shipping || ({} as GuestUserCheckoutAddress),
          errorMsg,
          braintreeTransactionId,
          paypalTransactionId,
          cart
        )
      }
      throw new InternalServerException(errorMsg)
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
          appName,
          appDomain,
          user?.email || '',
          user?.shipping || ({} as GuestUserCheckoutAddress),
          errorMsg,
          braintreeTransactionId,
          paypalTransactionId,
          cart
        )
      }
      throw new InternalServerException(errorMsg)
    }

    // Create Bigbuy order
    try {
      const bigbuyId = await BigbuyService.createOrder(
        order.id.toString(),
        user?.email || guestUserEmail || '',
        user?.shipping || shipping || ({} as GuestUserCheckoutAddress),
        orderProducts
      )
      order.merge({ bigbuyId })
      await order.save()
    } catch (error) {
      const errorMsg = `Create bigbuy order error: ${error.message}`
      await order.delete()
      if (sendCreateOrderEmail) {
        await MailService.sendErrorCreateOrderEmail(
          i18n,
          appName,
          appDomain,
          user?.email || '',
          user?.shipping || ({} as GuestUserCheckoutAddress),
          errorMsg,
          braintreeTransactionId,
          paypalTransactionId,
          cart
        )
      }
      throw new InternalServerException(errorMsg)
    }

    // Send check order email
    try {
      await order.loadBigbuyData()
      await MailService.sendCheckOrderEmail(
        i18n,
        appName,
        appDomain,
        user?.email || guestUserEmail || '',
        (user as User)?.firstName
          ? (user as User).firstName
          : user?.shipping.firstName || shipping?.firstName || '',
        order
      )
    } catch (error) {
      const errorMsg = `Send check order email error: ${error.message}`
      await MailService.sendErrorGetOrderEmail(i18n, appName, appDomain, errorMsg, order)
      throw new InternalServerException(errorMsg)
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

  public static async showOrder(
    ctx: HttpContextContract,
    id?: number,
    bigbuyId?: string,
    guestUserEmail?: string
  ) {
    const validToken = await ctx.auth.use('api').check()
    let order: Order | undefined
    if (validToken) {
      order = await this.getOrderById(id || -1, true, true, true)
      await ctx.bouncer.with('OrderPolicy').authorize('view', order)
    } else {
      order = await this.getOrderByBigbuyId(bigbuyId || '', true, true, true)
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
    appName: string,
    appDomain: string,
    user: GuestUserCheckout | User | undefined,
    guestUserId: number | undefined,
    cart: Cart | GuestCartCheck,
    braintreeTransactionId: string | undefined,
    paypalTransactionId: string | undefined
  ) {
    const order = await this.createOrder(
      i18n,
      appName,
      appDomain,
      user,
      guestUserId,
      undefined,
      undefined,
      cart,
      braintreeTransactionId,
      paypalTransactionId,
      true
    )
    return order
  }

  public static async createOrderByAdminRoute(
    locale: string,
    appName: string,
    appDomain: string,
    braintreeTransactionId: string | undefined,
    paypalTransactionId: string | undefined,
    userId: number | undefined,
    guestUserEmail: string | undefined,
    shipping: GuestUserCheckoutAddress,
    cart: GuestCart
  ) {
    const { user, guestUserId, cartCheck } = await PaymentsService.checkAdminPaymentData(
      userId,
      guestUserEmail,
      cart,
      {
        braintree: braintreeTransactionId,
        paypal: paypalTransactionId,
      }
    )
    const order = await this.createOrder(
      I18n.locale(locale),
      appName,
      appDomain,
      user,
      guestUserId,
      guestUserEmail,
      shipping,
      cartCheck,
      braintreeTransactionId,
      paypalTransactionId,
      false
    )
    return order
  }
}
