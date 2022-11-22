import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Order from 'App/Models/Order'
import UsersService from 'App/Services/UsersService'
import BraintreeService from 'App/Services/BraintreeService'
import BigbuyService from 'App/Services/BigbuyService'
import { PaymentResponse } from 'App/Controllers/Http/types'
import CreateTransactionValidator from 'App/Validators/Payment/CreateTransactionValidator'
import InternalServerException from 'App/Exceptions/InternalServerException'
import { logRouteSuccess } from 'App/Utils/logger'

export default class PaymentsController {
  public async createTransaction({ request, response, auth }: HttpContextContract) {
    const email = await UsersService.getAuthEmail(auth)
    const user = await UsersService.getUserByEmail(email, true)

    const validatedData = await request.validate(CreateTransactionValidator)

    // Braintree Transaction

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

    // Bigbuy Order

    const order = await Order.create({
      userId: user.id,
      braintreeTransactionId: result.transaction.id,
    })
    try {
      await BigbuyService.createOrder(user, order.id.toString())
    } catch (error) {
      await order.delete()
      throw new InternalServerException('Create bigbuy order error')
    }

    // Response

    const successMsg = `Successfully created transaction and order with user email ${email}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      braintreeToken: braintreeToken,
      order,
    } as PaymentResponse)
  }
}
