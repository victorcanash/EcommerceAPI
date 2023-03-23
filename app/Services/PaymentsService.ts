import Env from '@ioc:Adonis/Core/Env'
import { AuthContract } from '@ioc:Adonis/Addons/Auth'
import { I18nContract } from '@ioc:Adonis/Addons/I18n'

import { v4 as uuidv4 } from 'uuid'

import { firstBuyDiscount, PaymentModes } from 'App/Constants/payment'
import User from 'App/Models/User'
import Cart from 'App/Models/Cart'
import GuestUser from 'App/Models/GuestUser'
import { GuestUserCheckout } from 'App/Types/user'
import { GuestCart, GuestCartCheck } from 'App/Types/cart'
import BraintreeService from 'App/Services/BraintreeService'
import PaypalService from 'App/Services/PaypalService'
import UsersService from 'App/Services/UsersService'
import CartsService from 'App/Services/CartsService'
import OrdersService from 'App/Services/OrdersService'
import BadRequestException from 'App/Exceptions/BadRequestException'
import PermissionException from 'App/Exceptions/PermissionException'

export default class PaymentsService {
  private static checkPaymentData(
    user: User | GuestUserCheckout | undefined,
    cart?: Cart | GuestCartCheck,
    transactionIds?: {
      braintree?: string
      paypal?: string
    }
  ) {
    if (!cart?.items || cart.items.length <= 0) {
      throw new PermissionException(`You don't have selected items in your cart`)
    }

    let totalAmount = CartsService.getTotalAmount(cart).amount
    if (totalAmount <= 0) {
      throw new PermissionException(`Your don't have cart amount`)
    }
    let discount: number | undefined
    if ((user as User)?.firstName && !(user as User).firstOrder) {
      discount = parseFloat(((firstBuyDiscount / 100) * totalAmount).toFixed(2))
    }
    const amount = totalAmount.toFixed(2)

    if (transactionIds && !transactionIds.braintree && !transactionIds.paypal) {
      throw new BadRequestException('Missing transaction id')
    }

    return {
      amount,
      discount,
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
        /*const validConfirmToken = await auth.use('confirmation').check()
        if (!validConfirmToken) {
          throw new PermissionException('Invalid confirmation token')
        }
        guestUserId = await (await UsersService.getGuestUserByEmail(guestUser.email)).id*/
        let loggedUser = await User.query().where('email', guestUser.email).first()
        if (loggedUser) {
          throw new BadRequestException('The email entered belongs to a registered user')
        }
        let existingGuestUser = await GuestUser.query().where('email', guestUser.email).first()
        if (!existingGuestUser) {
          let newGuestUser = await GuestUser.create({
            email: guestUser.email,
            password: `${guestUser.email}-${uuidv4()}`,
          })
          guestUserId = newGuestUser.id
        } else {
          guestUserId = existingGuestUser.id
        }
      }
      if (revokeConfirmToken) {
        //await auth.use('confirmation').revoke()
      }
      cart = await CartsService.createGuestCartCheck(guestCart?.items)
    }
    if (!user.shipping) {
      throw new PermissionException(`You don't have an existing shipping address`)
    }
    if (!user.billing) {
      throw new PermissionException(`You don't have an existing billing address`)
    }
    const { amount, discount } = this.checkPaymentData(user, cart, transactionIds)

    return {
      user,
      guestUserId,
      cart,
      amount,
      discount,
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
    const { amount } = this.checkPaymentData(user, cart, transactionIds)

    return {
      user,
      guestUserId: guestUserId || -1,
      cartCheck,
      amount,
    }
  }

  public static async createBraintreeTransaction(
    i18n: I18nContract,
    auth: AuthContract,
    appName: string,
    appDomain: string,
    paymentMethodNonce: string,
    guestUser?: GuestUserCheckout,
    guestCart?: GuestCart,
    remember?: boolean
  ) {
    const { user, guestUserId, cart, amount } = await this.checkUserPaymentData(
      auth,
      true,
      guestUser,
      guestCart,
      true
    )

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

    OrdersService.createOrderByPayment(
      i18n,
      appName,
      appDomain,
      user,
      guestUserId,
      cart,
      transactionId,
      undefined
    )

    return transactionId
  }

  public static async createPaypalTransaction(
    i18n: I18nContract,
    auth: AuthContract,
    guestUser?: GuestUserCheckout,
    guestCart?: GuestCart,
    remember?: boolean
  ) {
    const { user, cart, amount, discount } = await this.checkUserPaymentData(
      auth,
      false,
      guestUser,
      guestCart
    )

    const orderProducts = await PaypalService.createOrderProducts(cart)
    const transactionId = await PaypalService.createOrder(
      i18n,
      user,
      orderProducts,
      amount,
      remember,
      discount
    )

    return transactionId
  }

  public static async capturePaypalTransaction(
    id: string,
    i18n: I18nContract,
    auth: AuthContract,
    appName: string,
    appDomain: string,
    guestUser?: GuestUserCheckout,
    guestCart?: GuestCart,
    remember?: boolean
  ) {
    const { user, guestUserId, cart } = await this.checkUserPaymentData(
      auth,
      true,
      guestUser,
      guestCart,
      true
    )

    const { transactionId, customerId } = await PaypalService.captureOrder(i18n, id)

    await this.updateUser(user, remember, undefined, customerId)

    await CartsService.onBuyItems(cart)

    OrdersService.createOrderByPayment(
      i18n,
      appName,
      appDomain,
      user,
      guestUserId,
      cart,
      undefined,
      transactionId
    )

    return transactionId
  }
}
