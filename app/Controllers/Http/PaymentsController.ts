import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'

import User from 'App/Models/User'
import GuestUser from 'App/Models/GuestUser'
import Order from 'App/Models/Order'
import Cart from 'App/Models/Cart'
import CartItem from 'App/Models/CartItem'
import UsersService from 'App/Services/UsersService'
import CartsService from 'App/Services/CartsService'
import BraintreeService from 'App/Services/BraintreeService'
import BigbuyService from 'App/Services/BigbuyService'
import MailService from 'App/Services/MailService'
import { GuestUserCheckout } from 'App/Types/user'
import { SendOrderProduct } from 'App/Types/order'
import { GuestCartCheck, GuestCartCheckItem } from 'App/Types/cart'
import { BasicResponse, BraintreeTokenResponse, OrderResponse } from 'App/Controllers/Http/types'
import CreateTransactionValidator from 'App/Validators/Payment/CreateTransactionValidator'
import SendConfirmTransactionEmailValidator from 'App/Validators/Payment/SendConfirmTransactionEmailValidator'
import BadRequestException from 'App/Exceptions/BadRequestException'
import InternalServerException from 'App/Exceptions/InternalServerException'
import { logRouteSuccess } from 'App/Utils/logger'

export default class PaymentsController {
  public async getBraintreeToken({ request, response, auth }: HttpContextContract) {
    let braintreeId: string | undefined
    const validToken = await auth.use('api').check()
    if (validToken) {
      const email = await UsersService.getAuthEmail(auth)
      braintreeId = await (await UsersService.getUserByEmail(email, true)).braintreeId
    }

    const braintreeService = new BraintreeService()
    let braintreeToken = await braintreeService.generateClientToken(braintreeId)

    const successMsg = `Successfully got braintree client token`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      braintreeToken: braintreeToken,
    } as BraintreeTokenResponse)
  }

  public async createTransaction({ request, response, auth, i18n }: HttpContextContract) {
    // Get user and cart data

    const validatedData = await request.validate(CreateTransactionValidator)

    let user: User | GuestUserCheckout | undefined
    let cart: Cart | GuestCartCheck | undefined

    const validToken = await auth.use('api').check()
    if (validToken) {
      const email = await UsersService.getAuthEmail(auth)
      user = await UsersService.getUserByEmail(email, true)
      cart = (user as User).cart
    } else {
      user = validatedData.guestUser
      if (!user) {
        throw new BadRequestException('Missing guestUser')
      }
      if (!validatedData.guestCart?.items || validatedData.guestCart.items.length <= 0) {
        throw new BadRequestException('Missing guestCart')
      }
      cart = await CartsService.createGuestCartCheck(validatedData.guestCart.items)
    }

    // Braintree Transaction

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

    const braintreeResult = await braintreeService.createTransaction(
      validatedData.paymentMethodNonce,
      user,
      braintreeCustomer,
      (cart as Cart)?.id ? undefined : (cart as GuestCartCheck)
    )

    if ((user as User)?.id && validatedData.remember) {
      ;(user as User).merge({
        braintreeId: braintreeResult.transaction.customer.id,
      })
      await (user as User).save()
    } else if ((user as User)?.braintreeId) {
      ;(user as User).merge({
        braintreeId: '',
      })
      await (user as User).save()
    }

    const braintreeTransactionId = braintreeResult.transaction.id

    // Bigbuy Order

    const order = await Order.create({
      userId: (user as User)?.id || -1,
      braintreeTransactionId: braintreeTransactionId,
    })
    const cartItemIds = [] as number[]
    const orderProducts = cart.items.map((item: CartItem | GuestCartCheckItem) => {
      if (item.quantity > 0) {
        if ((item as CartItem)?.id) {
          cartItemIds.push((item as CartItem).id)
        }
        return {
          reference: item.inventory.sku,
          quantity: item.quantity,
          internalReference: item.inventory.id.toString(),
        } as SendOrderProduct
      }
    })

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
        validatedData.appName,
        validatedData.appDomain,
        user.email,
        user.shipping,
        error.message,
        braintreeTransactionId,
        orderProducts
      )
      throw new InternalServerException('Create bigbuy order error')
    }

    try {
      await order.loadBigbuyData()
      await order.loadBraintreeData()
      await MailService.sendCheckOrderEmail(
        i18n,
        validatedData.appName,
        validatedData.appDomain,
        user.email,
        (user as User)?.firstName ? (user as User).firstName : user.shipping.firstName,
        order
      )
    } catch (error) {
      await MailService.sendErrorGetOrderEmail(
        i18n,
        validatedData.appName,
        validatedData.appDomain,
        error.message,
        order
      )
      throw new InternalServerException('Get order info error')
    }

    // Response

    const successMsg = `Successfully created transaction and order with user email ${user.email}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      order,
    } as OrderResponse)
  }

  public async sendConfirmTransactionEmail({ request, response, auth, i18n }: HttpContextContract) {
    const validatedData = await request.validate(SendConfirmTransactionEmailValidator)

    if (!validatedData.guestCart?.items || validatedData.guestCart.items.length <= 0) {
      throw new BadRequestException('Missing guestCart')
    }

    let guestUser = await GuestUser.query().where('email', validatedData.guestUser.email).first()
    if (!guestUser) {
      guestUser = await GuestUser.create({
        email: validatedData.guestUser.email,
      })
    }
    const shipping = validatedData.guestUser.shipping
    const billing = validatedData.guestUser.billing

    const tokenData = await auth.use('confirmation').generate(guestUser, {
      expiresIn: Env.get('CONFIRMATION_TOKEN_EXPIRY', '30mins'),
      payment_payload: validatedData.paymentPayload,
      shipping: shipping,
      billing: billing,
      guest_cart: validatedData.guestCart,
    })

    await MailService.sendConfirmationEmail(
      guestUser,
      shipping.firstName,
      i18n,
      validatedData.appName,
      validatedData.appDomain,
      validatedData.url + `?token=${tokenData.token}`
    )

    const successMsg = `Successfully sent confirm transaction email to ${guestUser.email}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
    } as BasicResponse)
  }
}
