import Env from '@ioc:Adonis/Core/Env'
import { AuthContract } from '@ioc:Adonis/Addons/Auth'
import { I18nContract } from '@ioc:Adonis/Addons/I18n'

import User from 'App/Models/User'
import Cart from 'App/Models/Cart'
import BraintreeService from 'App/Services/BraintreeService'
import PaypalService from 'App/Services/PaypalService'
import { GuestUserCheckout } from 'App/Types/user'
import { GuestCart, GuestCartCheck } from 'App/Types/cart'
import BadRequestException from 'App/Exceptions/BadRequestException'
import PermissionException from 'App/Exceptions/PermissionException'
import CartsService from './CartsService'
import UsersService from './UsersService'
import { PaymentModes } from 'App/Constants/payment'

export default class PaymentsService {
  private static checkPaymentData(
    cart?: Cart | GuestCartCheck,
    transactionIds?: {
      braintree?: string
      paypal?: string
    }
  ) {
    if (!cart?.items || cart.items.length <= 0) {
      throw new PermissionException(`You don't have selected items in your cart`)
    }

    const totalAmount = CartsService.getTotalAmount(cart).amount
    if (totalAmount <= 0) {
      throw new PermissionException(`Your don't have cart amount`)
    }
    const amount = totalAmount.toFixed(2)

    if (transactionIds && !transactionIds.braintree && !transactionIds.paypal) {
      throw new BadRequestException('Missing transaction id')
    }

    return {
      amount,
    }
  }

  private static async updateUser(
    user: User | GuestUserCheckout,
    remember?: boolean,
    braintreeId?: string,
    paypalId?: string
  ) {
    if ((user as User)?.id && remember) {
      if (braintreeId) {
        ;(user as User).merge({
          braintreeId: braintreeId,
        })
      } else if (paypalId) {
        ;(user as User).merge({
          paypalId: paypalId,
        })
      }
      await (user as User).save()
    } else if ((user as User)?.paypalId || (user as User)?.braintreeId) {
      if ((user as User)?.paypalId) {
        ;(user as User).merge({
          paypalId: '',
        })
      } else if ((user as User)?.braintreeId) {
        ;(user as User).merge({
          braintreeId: '',
        })
      }
      await (user as User).save()
    }
  }

  public static checkPaymentMode(paymentMode: PaymentModes) {
    if (Env.get('PAYMENT_MODE', PaymentModes.BRAINTREE) !== paymentMode) {
      throw new PermissionException('This payment mode is disabled')
    }
  }

  public static async checkUserPaymentData(
    auth: AuthContract,
    requiredConfirmToken: boolean,
    guestUser?: GuestUserCheckout,
    guestCart?: GuestCart,
    revokeConfirmToken?: boolean,
    transactionIds?: {
      braintree?: string
      paypal?: string
    }
  ) {
    let user: User | GuestUserCheckout
    let guestUserId: number | undefined
    let cart: Cart | GuestCartCheck
    const validApiToken = await auth.use('api').check()
    if (validApiToken) {
      const email = await UsersService.getAuthEmail(auth)
      user = await UsersService.getUserByEmail(email, true)
      cart = (user as User).cart
    } else {
      if (!guestUser) {
        throw new BadRequestException('Missing guestUser')
      }
      user = guestUser
      if (requiredConfirmToken) {
        const email = await UsersService.getAuthEmail(auth, 'confirmation')
        guestUserId = await (await UsersService.getGuestUserByEmail(email)).id
        if (revokeConfirmToken) {
          await auth.use('confirmation').revoke()
        }
      }
      cart = await CartsService.createGuestCartCheck(guestCart?.items)
    }
    if (!user.shipping) {
      throw new PermissionException(`You don't have an existing shipping address`)
    }
    if (!user.billing) {
      throw new PermissionException(`You don't have an existing billing address`)
    }
    const { amount } = this.checkPaymentData(cart, transactionIds)

    return {
      user,
      guestUserId,
      cart,
      amount,
    }
  }

  public static async checkAdminPaymentData(
    userId: number | undefined,
    guestUserEmail: string | undefined,
    cart: GuestCart,
    transactionIds?: {
      braintree?: string
      paypal?: string
    }
  ) {
    const user = userId ? await UsersService.getUserById(userId, false) : undefined
    let guestUserId: number | undefined
    if (!user) {
      if (!guestUserEmail) {
        throw new BadRequestException('Missing user email')
      }
      guestUserId = await (await UsersService.getGuestUserByEmail(guestUserEmail)).id
    }
    const cartCheck = await CartsService.createGuestCartCheck(cart?.items)
    const { amount } = this.checkPaymentData(cart, transactionIds)

    return {
      user,
      guestUserId: guestUserId || -1,
      cartCheck,
      amount,
    }
  }

  public static async createBraintreeTransaction(
    auth: AuthContract,
    paymentMethodNonce: string,
    guestUser?: GuestUserCheckout,
    guestCart?: GuestCart,
    remember?: boolean
  ) {
    const { user, cart, amount } = await this.checkUserPaymentData(auth, true, guestUser, guestCart)

    const braintreeService = new BraintreeService()
    const braintreeCustomer = (user as User)?.id
      ? await braintreeService.getCustomer((user as User).braintreeId)
      : undefined
    if (
      (user as User)?.id &&
      braintreeCustomer &&
      (braintreeCustomer.firstName !== (user as User).firstName ||
        braintreeCustomer.lastName !== (user as User).lastName ||
        braintreeCustomer.email !== user.email)
    ) {
      await braintreeService.updateCustomer(braintreeCustomer.id, user as User)
    }

    const { transactionId, customerId } = await braintreeService.createTransaction(
      paymentMethodNonce,
      user,
      amount,
      braintreeCustomer
    )

    await this.updateUser(user, remember, customerId, undefined)

    await CartsService.onBuyItems(cart)

    return transactionId
  }

  public static async createPaypalTransaction(
    i18n: I18nContract,
    auth: AuthContract,
    guestUser?: GuestUserCheckout,
    guestCart?: GuestCart,
    remember?: boolean
  ) {
    const { user, cart, amount } = await this.checkUserPaymentData(
      auth,
      false,
      guestUser,
      guestCart
    )

    const orderProducts = await PaypalService.createOrderProducts(cart)
    const { orderId, paypalEmail } = await PaypalService.createOrder(
      i18n,
      user,
      orderProducts,
      amount,
      remember
    )

    return { transactionId: orderId, paypalEmail }
  }

  public static async capturePaypalTransaction(
    id: string,
    i18n: I18nContract,
    auth: AuthContract,
    guestUser?: GuestUserCheckout,
    guestCart?: GuestCart,
    remember?: boolean
  ) {
    const { user, cart } = await this.checkUserPaymentData(auth, true, guestUser, guestCart)

    const { transactionId, customerId } = await PaypalService.captureOrder(i18n, id)

    await this.updateUser(user, remember, undefined, customerId)

    await CartsService.onBuyItems(cart)

    return transactionId
  }
}
