import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import UsersService from 'App/Services/UsersService'
import PaymentsService from 'App/Services/PaymentsService'
import PaypalService from 'App/Services/PaypalService'
import { PaypalUserTokenResponse, PaypalTransactionResponse } from 'App/Controllers/Http/types'
import { CheckoutData } from 'App/Types/checkout'
import { GuestCart } from 'App/Types/cart'
import CreatePaypalTransactionValidator from 'App/Validators/Payment/CreatePaypalTransactionValidator'
import CapturePaypalTransactionValidator from 'App/Validators/Payment/CapturePaypalTransactionValidator'
import { logRouteSuccess } from 'App/Utils/logger'

export default class PaymentsController {
  public async getPaypalUserToken({ request, response, auth, i18n }: HttpContextContract) {
    const email = await UsersService.getAuthEmail(auth)
    const user = await UsersService.getUserByEmail(email, false)

    const paypalUserToken = await PaypalService.generateUserToken(i18n, user.paypalId)

    const successMsg = `Successfully got paypal user token of ${user.email}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      paypalUserToken: paypalUserToken,
    } as PaypalUserTokenResponse)
  }

  public async createPaypalTransaction({ request, response, auth, i18n }: HttpContextContract) {
    const validatedData = await request.validate(CreatePaypalTransactionValidator)

    const transactionId = await PaymentsService.createPaypalTransaction(
      i18n,
      auth,
      validatedData.checkoutData as CheckoutData,
      validatedData.guestCart as GuestCart
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
    const validatedData = await request.validate(CapturePaypalTransactionValidator)

    const transactionId = await PaymentsService.capturePaypalTransaction(
      id,
      i18n,
      auth,
      validatedData.appName,
      validatedData.appDomain,
      validatedData.checkoutData as CheckoutData,
      validatedData.guestCart as GuestCart
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
