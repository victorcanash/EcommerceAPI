import { AuthContract } from '@ioc:Adonis/Addons/Auth'
import { I18nContract } from '@ioc:Adonis/Addons/I18n'

import { v4 as uuidv4 } from 'uuid'

import { firstBuyDiscountPercent, vatPercent } from 'App/Constants/payment'
import { AddressTypes } from 'App/Constants/addresses'
import User from 'App/Models/User'
import GuestUser from 'App/Models/GuestUser'
import Cart from 'App/Models/Cart'
import UserAddress from 'App/Models/UserAddress'
import { CheckoutData } from 'App/Types/checkout'
import { GuestCart, GuestCartCheck } from 'App/Types/cart'
import PaypalService from 'App/Services/PaypalService'
import UsersService from 'App/Services/UsersService'
import CartsService from 'App/Services/CartsService'
import OrdersService from 'App/Services/OrdersService'
import { roundTwoDecimals, roundTwoDecimalsToString } from 'App/Utils/numbers'
import BadRequestException from 'App/Exceptions/BadRequestException'
import PermissionException from 'App/Exceptions/PermissionException'

export default class PaymentsService {
  private static async updateUser(
    user: User,
    paypalCustomerId: string,
    checkoutData: CheckoutData
  ) {
    if (checkoutData.remember) {
      user.merge({
        paypalId: paypalCustomerId,
      })
      await user.save()
      await user.load('shipping')
      await user.load('billing')
      if (user.shipping) {
        user.shipping.merge(checkoutData.shipping)
        await user.shipping.save()
      } else {
        await UserAddress.create({
          ...checkoutData.shipping,
          userId: user.id,
          type: AddressTypes.SHIPPING,
        })
      }
      if (user.billing) {
        user.billing.merge(checkoutData.billing)
        await user.billing.save()
      } else {
        await UserAddress.create({
          ...checkoutData.billing,
          userId: user.id,
          type: AddressTypes.BILLING,
        })
      }
    } else {
      if (user.paypalId) {
        user.merge({
          paypalId: '',
        })
      }
      await user.save()
    }
  }

  private static checkPaymentData(user: User | undefined, cart: Cart | GuestCartCheck) {
    if (!cart?.items || cart.items.length <= 0) {
      throw new PermissionException(`You don't have selected items in your cart`)
    }

    // Cart Amount
    const cartAmount = CartsService.getTotalAmount(cart).amount
    if (cartAmount <= 0) {
      throw new PermissionException(`Your don't have cart amount`)
    }
    // First Buy Discount
    let discount = 0
    if (user && !user.firstOrder) {
      discount = roundTwoDecimals((firstBuyDiscountPercent / 100) * cartAmount)
    }
    // Total VAT
    const vat = (vatPercent / 100) * (cartAmount - discount)

    return {
      cartAmount: roundTwoDecimalsToString(cartAmount),
      discount: roundTwoDecimalsToString(discount),
      vat: roundTwoDecimalsToString(vat),
      amount: roundTwoDecimalsToString(cartAmount - discount + vat),
    }
  }

  private static async checkUserPaymentData(
    auth: AuthContract,
    checkoutData: CheckoutData,
    guestCart?: GuestCart,
    createGuestUser?: boolean
  ) {
    let user: User | undefined
    let guestUser: GuestUser | undefined
    let cart: Cart | GuestCartCheck
    const validApiToken = await auth.use('api').check()
    if (validApiToken) {
      const email = await UsersService.getAuthEmail(auth)
      user = await UsersService.getUserByEmail(email, true)
      if (checkoutData.email !== user.email) {
        throw new BadRequestException('The checkout email does not match the user email')
      }
      cart = user.cart
    } else {
      let loggedUser = await User.query().where('email', checkoutData.email).first()
      if (loggedUser) {
        throw new BadRequestException('The email entered belongs to a registered user')
      }
      if (createGuestUser) {
        guestUser =
          (await GuestUser.query().where('email', checkoutData.email).first()) || undefined
        if (!guestUser) {
          guestUser = await GuestUser.create({
            email: checkoutData.email,
            password: `${checkoutData.email}-${uuidv4()}`,
          })
        }
      }
      cart = await CartsService.createGuestCartCheck(guestCart?.items)
    }
    const { cartAmount, discount, vat, amount } = this.checkPaymentData(user, cart)

    return {
      user,
      guestUser,
      cart,
      cartAmount,
      discount,
      vat,
      amount,
    }
  }

  public static async checkAdminPaymentData(checkoutData: CheckoutData, cart: GuestCart) {
    let user: User | undefined
    let guestUser: GuestUser | undefined
    user = (await User.query().where('email', checkoutData.email).first()) || undefined
    if (!user) {
      guestUser = (await GuestUser.query().where('email', checkoutData.email).first()) || undefined
      if (!guestUser) {
        throw new BadRequestException('Cannot find user/guestuser by checkout email')
      }
    }
    const cartCheck = await CartsService.createGuestCartCheck(cart?.items)
    const { cartAmount, discount, vat, amount } = this.checkPaymentData(user, cartCheck)

    return {
      user,
      guestUser,
      cartCheck,
      cartAmount,
      discount,
      vat,
      amount,
    }
  }

  public static async createPaypalTransaction(
    i18n: I18nContract,
    auth: AuthContract,
    checkoutData: CheckoutData,
    guestCart?: GuestCart
  ) {
    const { cart, cartAmount, discount, vat, amount } = await this.checkUserPaymentData(
      auth,
      checkoutData,
      guestCart
    )

    const orderProducts = await PaypalService.createOrderProducts(cart)
    const transactionId = await PaypalService.createOrder(
      i18n,
      checkoutData,
      orderProducts,
      cartAmount,
      discount,
      vat,
      amount
    )

    return transactionId
  }

  public static async capturePaypalTransaction(
    id: string,
    i18n: I18nContract,
    auth: AuthContract,
    appName: string,
    appDomain: string,
    checkoutData: CheckoutData,
    guestCart?: GuestCart
  ) {
    const { user, guestUser, cart } = await this.checkUserPaymentData(
      auth,
      checkoutData,
      guestCart,
      true
    )

    const { transactionId, customerId } = await PaypalService.captureOrder(i18n, id)

    if (user) {
      await this.updateUser(user, customerId, checkoutData)
    }

    await CartsService.onBuyItems(cart)

    OrdersService.createOrderByPayment(
      i18n,
      appName,
      appDomain,
      checkoutData,
      user,
      guestUser,
      cart,
      transactionId
    )

    return transactionId
  }
}
