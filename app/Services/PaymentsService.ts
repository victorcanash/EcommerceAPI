import { AuthContract } from '@ioc:Adonis/Addons/Auth'
import { I18nContract } from '@ioc:Adonis/Addons/I18n'

import { v4 as uuidv4 } from 'uuid'

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
import BadRequestException from 'App/Exceptions/BadRequestException'
import PermissionException from 'App/Exceptions/PermissionException'

export default class PaymentsService {
  private static async updateUser(
    user: User,
    paypalCustomerId: string,
    checkoutData: CheckoutData
  ) {
    // Save payment data
    if (checkoutData.remember) {
      user.merge({
        paypalId: paypalCustomerId,
      })
      await user.save()
    } else {
      if (user.paypalId) {
        user.merge({
          paypalId: '',
        })
      }
      await user.save()
    }
    // Save addresses
    await user.load('shipping')
    await user.load('billing')
    if (user.shipping) {
      user.shipping.merge({
        ...checkoutData.shipping,
        addressLine2: checkoutData.shipping.addressLine2 || '',
      })
      await user.shipping.save()
    } else {
      await UserAddress.create({
        ...checkoutData.shipping,
        addressLine2: checkoutData.shipping.addressLine2 || '',
        userId: user.id,
        type: AddressTypes.SHIPPING,
      })
    }
    if (user.billing) {
      user.billing.merge({
        ...checkoutData.billing,
        addressLine2: checkoutData.billing.addressLine2 || '',
      })
      await user.billing.save()
    } else {
      await UserAddress.create({
        ...checkoutData.billing,
        addressLine2: checkoutData.billing.addressLine2 || '',
        userId: user.id,
        type: AddressTypes.BILLING,
      })
    }
  }

  private static checkPaymentData(cart: Cart | GuestCartCheck) {
    if (!cart?.items || cart.items.length <= 0) {
      throw new PermissionException(`You don't have selected items in your cart`)
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
    this.checkPaymentData(cart)

    return {
      user,
      guestUser,
      cart,
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
    this.checkPaymentData(cartCheck)

    return {
      user,
      guestUser,
      cartCheck,
    }
  }

  public static async createPaypalTransaction(
    i18n: I18nContract,
    auth: AuthContract,
    checkoutData: CheckoutData,
    guestCart?: GuestCart
  ) {
    const { user, cart } = await this.checkUserPaymentData(auth, checkoutData, guestCart)

    const transactionId = await PaypalService.createOrder(i18n, checkoutData, cart, user)

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
