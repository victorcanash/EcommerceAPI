import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { AuthContract } from '@ioc:Adonis/Addons/Auth'
import I18n, { I18nContract } from '@ioc:Adonis/Addons/I18n'

import Order from 'App/Models/Order'
import User from 'App/Models/User'
import { GuestUserCheckout, GuestUserCheckoutAddress } from 'App/Types/user'
import { GuestCart } from 'App/Types/cart'
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

  public static async createOrder(
    i18n: I18nContract,
    auth: AuthContract,
    appName: string,
    appDomain: string,
    braintreeTransactionId: string | undefined,
    paypalTransactionId: string | undefined,
    guestUser?: GuestUserCheckout,
    guestCart?: GuestCart
  ) {
    const { user, guestUserId, cart } = await PaymentsService.checkUserPaymentData(
      auth,
      true,
      guestUser,
      guestCart,
      true,
      {
        braintree: braintreeTransactionId,
        paypal: paypalTransactionId,
      }
    )

    const guestCartItems = await CartsService.convertToGuestCartItems(cart)
    const order = await Order.create({
      userId: (user as User)?.id || undefined,
      guestUserId: guestUserId,
      braintreeTransactionId: braintreeTransactionId,
      paypalTransactionId: paypalTransactionId,
      products: guestCartItems,
    })
    const orderProducts = await BigbuyService.createOrderProducts(cart)

    try {
      await order.loadPaymentData()
      await order.loadItemsData()
    } catch (error) {
      await order.delete()
      throw new InternalServerException(`Get payment data error: ${error.message}`)
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
      throw new InternalServerException(`Create bigbuy order error: ${error.message}`)
    }

    try {
      await order.loadBigbuyData()
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
      throw new InternalServerException(`Send check order email error: ${error.message}`)
    }

    return order
  }

  public static async createAdminOrder(
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

    const order = await Order.create({
      userId: user?.id,
      guestUserId: guestUserId,
      braintreeTransactionId: braintreeTransactionId,
      paypalTransactionId: paypalTransactionId,
      products: cart.items,
    })
    const orderProducts = await BigbuyService.createOrderProducts(cartCheck)

    try {
      await order.loadPaymentData()
      await order.loadItemsData()
    } catch (error) {
      await order.delete()
      throw new InternalServerException(`Get payment data error: ${error.message}`)
    }

    try {
      const bigbuyId = await BigbuyService.createOrder(
        order.id.toString(),
        user?.email || guestUserEmail || '',
        shipping,
        orderProducts
      )
      order.merge({ bigbuyId })
      await order.save()
    } catch (error) {
      await order.delete()
      throw new InternalServerException(`Create bigbuy order error: ${error.message}`)
    }

    try {
      await order.loadBigbuyData()
      await MailService.sendCheckOrderEmail(
        I18n.locale(locale),
        appName,
        appDomain,
        user?.email || guestUserEmail || '',
        user?.firstName || shipping.firstName,
        order
      )
    } catch (error) {
      await MailService.sendErrorGetOrderEmail(
        I18n.locale(locale),
        appName,
        appDomain,
        error.message,
        order
      )
      throw new InternalServerException(`Send check order email error: ${error.message}`)
    }

    return order
  }
}
