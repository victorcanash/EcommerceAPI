import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import UsersService from 'App/Services/UsersService'
import BraintreeService from 'App/Services/BraintreeService'
import { PaymentResponse } from 'App/Controllers/Http/types'
import CreateTransactionValidator from 'App/Validators/Payment/CreateTransactionValidator'
import { logRouteSuccess } from 'App/Utils/logger'

export default class PaymentsController {
  public async createTransaction({ request, response, auth }: HttpContextContract) {
    const email = await UsersService.getAuthEmail(auth)
    const user = await UsersService.getUserByEmail(email, true)

    const validatedData = await request.validate(CreateTransactionValidator)

    const braintreeService = new BraintreeService()

    const braintreeCustomer = await braintreeService.getCustomer(user.braintreeId)
    if (
      braintreeCustomer &&
      (braintreeCustomer.firstName !== user.firstName ||
        braintreeCustomer.lastName !== user.lastName ||
        braintreeCustomer.email !== user.email)
    ) {
      await braintreeService.updateCustomer(braintreeCustomer.id, user)
    }

    const result = await braintreeService.createTransaction(
      user,
      braintreeCustomer,
      validatedData.paymentMethodNonce
    )

    user.merge({
      braintreeId: result.transaction.customer.id,
    })
    await user.save()

    const braintreeToken = await braintreeService.generateClientToken(user.braintreeId)

    const successMsg = `Successfully created transaction with user email ${email}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      transactionId: result.transaction.id,
      braintreeToken: braintreeToken,
    } as PaymentResponse)
  }
}
