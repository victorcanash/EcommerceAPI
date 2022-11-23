import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Order from 'App/Models/Order'
import UsersService from 'App/Services/UsersService'
import CartsService from 'App/Services/CartsService'
import BraintreeService from 'App/Services/BraintreeService'
import BigbuyService from 'App/Services/BigbuyService'
import { OrderResponse } from 'App/Controllers/Http/types'
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

    const braintreeResult = await braintreeService.createTransaction(
      user,
      braintreeCustomer,
      validatedData.paymentMethodNonce
    )

    user.merge({
      braintreeId: braintreeResult.transaction.customer.id,
    })
    await user.save()

    const braintreeTransactionId = braintreeResult.transaction.id

    // Bigbuy Order

    const order = await Order.create({
      userId: user.id,
      braintreeTransactionId: braintreeTransactionId,
    })
    const orderProducts = user.cart.items.map((item) => {
      if (item.quantity > 0) {
        return {
          reference: item.inventory.sku,
          quantity: item.quantity,
          internalReference: item.inventory.id.toString(),
        }
      }
    })

    await CartsService.deleteCartItems(user.cart)

    try {
      await BigbuyService.createOrder(order.id.toString(), user.email, user.shipping, orderProducts)
    } catch (error) {
      await order.delete()
      await user.sendErrorCreateOrderEmail(
        validatedData.appName,
        validatedData.appDomain,
        error.message,
        braintreeTransactionId,
        orderProducts
      )
      throw new InternalServerException('Create bigbuy order error')
    }

    try {
      await order.loadBigbuyData()
      await order.loadBraintreeData()
    } catch (error) {
      await user.sendErrorGetOrderEmail(validatedData.appName, validatedData.appDomain, order)
      throw new InternalServerException('Get order info error')
    }

    await user.sendCheckOrderEmail(validatedData.appName, validatedData.appDomain, order)

    // Response

    const successMsg = `Successfully created transaction and order with user email ${email}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      order,
    } as OrderResponse)
  }
}
