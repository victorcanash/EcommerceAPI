import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { RequestContract } from '@ioc:Adonis/Core/Request'
import { AuthContract } from '@ioc:Adonis/Addons/Auth'
import Env from '@ioc:Adonis/Core/Env'
import { DateTime } from 'luxon'

import { v4 as uuidv4 } from 'uuid'

import User from 'App/Models/User'
import GuestUser from 'App/Models/GuestUser'
import Cart from 'App/Models/Cart'
import UsersService from 'App/Services/UsersService'
import CartsService from 'App/Services/CartsService'
import PaymentsService from 'App/Services/PaymentsService'
import PaypalService from 'App/Services/PaypalService'
import OrdersService from 'App/Services/OrdersService'
import MailService from 'App/Services/MailService'
import {
  BasicResponse,
  GuestUserDataResponse,
  OrderResponse,
  PaypalResponse,
} from 'App/Controllers/Http/types'
import { PaymentModes } from 'App/Constants/payment'
import { GuestUserCheckout, GuestUserCheckoutAddress } from 'App/Types/user'
import { GuestCartCheck } from 'App/Types/cart'
import CreateTransactionValidator from 'App/Validators/Payment/CreateTransactionValidator'
import SendConfirmTransactionEmailValidator from 'App/Validators/Payment/SendConfirmTransactionEmailValidator'
import BadRequestException from 'App/Exceptions/BadRequestException'
import PermissionException from 'App/Exceptions/PermissionException'
import InternalServerException from 'App/Exceptions/InternalServerException'
import { logRouteSuccess } from 'App/Utils/logger'

export default class PaymentsController {
  public async sendConfirmTransactionEmail({ request, response, auth, i18n }: HttpContextContract) {
    const validatedData = await request.validate(SendConfirmTransactionEmailValidator)

    if (!validatedData.guestCart?.items || validatedData.guestCart.items.length <= 0) {
      throw new BadRequestException('Missing guestCart')
    }
    if (!validatedData.guestUser) {
      throw new BadRequestException('Missing guestUser')
    }

    let loggedUser = await User.query().where('email', validatedData.guestUser.email).first()
    if (loggedUser) {
      throw new BadRequestException('The email entered belongs to a registered user')
    }

    let guestUser = await GuestUser.query().where('email', validatedData.guestUser.email).first()
    if (!guestUser) {
      guestUser = await GuestUser.create({
        email: validatedData.guestUser.email,
        password: `${validatedData.guestUser.email}-${uuidv4()}`,
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

  public async getGuestUserData({ request, response, auth }: HttpContextContract) {
    const email = await UsersService.getAuthEmail(auth, 'confirmation')
    const guestUser = await UsersService.getGuestUserByEmail(email)

    const paymentPayload = auth.use('confirmation').token?.meta?.payment_payload
    const shipping = auth.use('confirmation').token?.meta?.shipping
    const billing = auth.use('confirmation').token?.meta?.billing
    const guestCart = auth.use('confirmation').token?.meta?.guest_cart

    guestUser.emailVerifiedAt = DateTime.local()
    await guestUser.save()

    const guestCartCheck = await CartsService.createGuestCartCheck(guestCart?.items)

    const successMsg = `Successfully got guest user data with email ${email}`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      guestUser: {
        email: email,
        shipping: shipping as GuestUserCheckoutAddress,
        billing: billing as GuestUserCheckoutAddress,
      },
      guestCart: guestCartCheck,
      paymentPayload: paymentPayload,
    } as GuestUserDataResponse)
  }

  public async createTransaction({ request, response, auth, i18n }: HttpContextContract) {
    const {
      appName,
      appDomain,
      validConfirmToken,
      user,
      guestUserId,
      cart,
      paymentMethodNonce,
      remember,
    } = await this.getCustomerData(
      request,
      auth,
      Env.get('PAYMENT_MODE', PaymentModes.BRAINTREE) === PaymentModes.PAYPAL ? false : true
    )

    // Create transaction
    const { braintreeTransactionId, paypalOrderId } = await PaymentsService.createTransaction(
      user,
      (cart as Cart)?.id ? undefined : (cart as GuestCartCheck),
      paymentMethodNonce,
      remember
    )
    if (!braintreeTransactionId && !paypalOrderId) {
      throw new InternalServerException(
        'Something went wrong, empty braintreeTransactionId and paypalOrderId'
      )

      // Create order by braintree
    } else if (braintreeTransactionId) {
      if (validConfirmToken) {
        await auth.use('confirmation').revoke()
      }
      const order = await OrdersService.createOrder(
        i18n,
        appName,
        appDomain,
        user,
        guestUserId,
        cart,
        braintreeTransactionId,
        undefined
      )

      const successMsg = `Successfully created braintree transaction and order with user email ${user.email}`
      logRouteSuccess(request, successMsg)
      return response.created({
        code: 201,
        message: successMsg,
        order,
      } as OrderResponse)

      // Return order id by paypal
    } else if (paypalOrderId) {
      const successMsg = `Successfully created paypal order with user email ${user.email}`
      logRouteSuccess(request, successMsg)
      return response.created({
        code: 201,
        message: successMsg,
        paypalOrderId: paypalOrderId,
      } as PaypalResponse)
    }
  }

  public async capturePaypalTransaction({
    params: { id },
    request,
    response,
    auth,
    i18n,
  }: HttpContextContract) {
    if (Env.get('PAYMENT_MODE', PaymentModes.BRAINTREE) === PaymentModes.BRAINTREE) {
      throw new PermissionException('Braintree payment mode is activated')
    }

    const { appName, appDomain, validConfirmToken, user, guestUserId, cart } =
      await this.getCustomerData(request, auth)

    // Capture paypal transaction
    const paypalTransactionId = await PaypalService.captureOrder(id)
    if (validConfirmToken) {
      await auth.use('confirmation').revoke()
    }

    // Create order by paypal
    const order = await OrdersService.createOrder(
      i18n,
      appName,
      appDomain,
      user,
      guestUserId,
      cart,
      undefined,
      paypalTransactionId
    )

    const successMsg = `Successfully captured paypal transaction and created order with user email ${user.email}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      order,
    } as OrderResponse)
  }

  private async getCustomerData(
    request: RequestContract,
    auth: AuthContract,
    guestUserIdByToken = true
  ) {
    let user: User | GuestUserCheckout | undefined
    let guestUserId: number | undefined
    let cart: Cart | GuestCartCheck | undefined

    const validatedData = await request.validate(CreateTransactionValidator)

    const validApiToken = await auth.use('api').check()
    const validConfirmToken = await auth.use('confirmation').check()
    if (validApiToken) {
      const email = await UsersService.getAuthEmail(auth)
      user = await UsersService.getUserByEmail(email, true)
      cart = (user as User).cart
    } else if (validConfirmToken) {
      let email: string | undefined
      if (guestUserIdByToken) {
        email = await UsersService.getAuthEmail(auth, 'confirmation')
      }
      user = validatedData.guestUser
      if (!user) {
        throw new BadRequestException('Missing guestUser')
      }
      if (!validatedData.guestCart?.items || validatedData.guestCart.items.length <= 0) {
        throw new BadRequestException('Missing guestCart')
      }
      if (guestUserIdByToken && email) {
        guestUserId = await (await UsersService.getGuestUserByEmail(email)).id
      }
      cart = await CartsService.createGuestCartCheck(validatedData.guestCart.items)
    } else {
      throw new PermissionException('Invalid token')
    }

    return {
      appName: validatedData.appName,
      appDomain: validatedData.appDomain,
      validConfirmToken,
      user,
      guestUserId,
      cart,
      paymentMethodNonce: validatedData.paymentMethodNonce,
      remember: validatedData.remember,
    }
  }
}
