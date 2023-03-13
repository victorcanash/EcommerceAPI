import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'
import { DateTime } from 'luxon'

import { v4 as uuidv4 } from 'uuid'

import User from 'App/Models/User'
import GuestUser from 'App/Models/GuestUser'
import UsersService from 'App/Services/UsersService'
import CartsService from 'App/Services/CartsService'
import PaymentsService from 'App/Services/PaymentsService'
import PaypalService from 'App/Services/PaypalService'
import MailService from 'App/Services/MailService'
import {
  BasicResponse,
  PaypalUserTokenResponse,
  GuestUserDataResponse,
  BraintreeTransactionResponse,
  PaypalTransactionResponse,
} from 'App/Controllers/Http/types'
import { PaymentModes } from 'App/Constants/payment'
import { GuestUserCheckout, GuestUserCheckoutAddress } from 'App/Types/user'
import { GuestCart } from 'App/Types/cart'
import SendConfirmTransactionEmailValidator from 'App/Validators/Payment/SendConfirmTransactionEmailValidator'
import CreatePaypalTransactionValidator from 'App/Validators/Payment/CreatePaypalTransactionValidator'
import CreateBraintreeTransactionValidator from 'App/Validators/Payment/CreateBraintreeTransactionValidator'
import CapturePaypalTransactionValidator from 'App/Validators/Payment/CapturePaypalTransactionValidator'
import BadRequestException from 'App/Exceptions/BadRequestException'
import { logRouteSuccess } from 'App/Utils/logger'

export default class PaymentsController {
  public async getPaypalUserToken({ request, response, auth, i18n }: HttpContextContract) {
    PaymentsService.checkPaymentMode(PaymentModes.PAYPAL)

    const email = await UsersService.getAuthEmail(auth)
    const user = await UsersService.getUserByEmail(email, true)

    const paypalUserToken = await PaypalService.generateUserToken(i18n, user.paypalId)

    const successMsg = `Successfully got paypal user token of ${user.email}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      paypalUserToken: paypalUserToken,
    } as PaypalUserTokenResponse)
  }

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
      payment_payload: validatedData.checkoutPayment,
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

    const checkoutPayment = auth.use('confirmation').token?.meta?.payment_payload
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
      checkoutPayment: checkoutPayment,
    } as GuestUserDataResponse)
  }

  public async createBraintreeTransaction({ request, response, auth, i18n }: HttpContextContract) {
    PaymentsService.checkPaymentMode(PaymentModes.BRAINTREE)

    const validatedData = await request.validate(CreateBraintreeTransactionValidator)

    const transactionId = await PaymentsService.createBraintreeTransaction(
      i18n,
      auth,
      validatedData.appName,
      validatedData.appDomain,
      validatedData.paymentMethodNonce,
      validatedData.guestUser,
      validatedData.guestCart as GuestCart,
      validatedData.remember
    )

    const successMsg = `Successfully created braintree transaction ${transactionId}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      braintreeTransactionId: transactionId,
    } as BraintreeTransactionResponse)
  }

  public async createPaypalTransaction({ request, response, auth, i18n }: HttpContextContract) {
    PaymentsService.checkPaymentMode(PaymentModes.PAYPAL)

    const validatedData = await request.validate(CreatePaypalTransactionValidator)

    const transactionId = await PaymentsService.createPaypalTransaction(
      i18n,
      auth,
      validatedData.guestUser as GuestUserCheckout,
      validatedData.guestCart as GuestCart,
      validatedData.remember
    )

    const successMsg = `Successfully created paypal transaction ${transactionId}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      paypalTransactionId: transactionId,
    } as PaypalTransactionResponse)
  }

  public async capturePaypalTransaction({
    params: { id },
    request,
    response,
    auth,
    i18n,
  }: HttpContextContract) {
    PaymentsService.checkPaymentMode(PaymentModes.PAYPAL)

    const validatedData = await request.validate(CapturePaypalTransactionValidator)

    const transactionId = await PaymentsService.capturePaypalTransaction(
      id,
      i18n,
      auth,
      validatedData.appName,
      validatedData.appDomain,
      validatedData.guestUser,
      validatedData.guestCart as GuestCart,
      validatedData.remember
    )

    const successMsg = `Successfully captured paypal transaction ${transactionId}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      paypalTransactionId: transactionId,
    } as PaypalTransactionResponse)
  }
}
