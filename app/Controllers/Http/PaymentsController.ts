import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Order from 'App/Models/Order'
import CartItem from 'App/Models/CartItem'
import UsersService from 'App/Services/UsersService'
import BraintreeService from 'App/Services/BraintreeService'
import BigbuyService from 'App/Services/BigbuyService'
import { OrderResponse } from 'App/Controllers/Http/types'
import CreateTransactionValidator from 'App/Validators/Payment/CreateTransactionValidator'
import InternalServerException from 'App/Exceptions/InternalServerException'
import { logRouteSuccess } from 'App/Utils/logger'

export default class PaymentsController {
  public async createTransaction({ request, response, auth, i18n }: HttpContextContract) {
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

    if (validatedData.remember) {
      user.merge({
        braintreeId: braintreeResult.transaction.customer.id,
      })
      await user.save()
    } else if (user.braintreeId) {
      user.merge({
        braintreeId: '',
      })
      await user.save()
    }

    const braintreeTransactionId = braintreeResult.transaction.id

    // Bigbuy Order

    const order = await Order.create({
      userId: user.id,
      braintreeTransactionId: braintreeTransactionId,
    })
    const cartItemsId = [] as number[]
    const orderProducts = user.cart.items.map((item) => {
      if (item.quantity > 0) {
        cartItemsId.push(item.id)
        return {
          reference: item.inventory.sku,
          quantity: item.quantity,
          internalReference: item.inventory.id.toString(),
        }
      }
    })

    await CartItem.query().whereIn('id', cartItemsId).delete()

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
      await user.sendErrorCreateOrderEmail(
        i18n,
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
      await user.sendCheckOrderEmail(i18n, validatedData.appName, validatedData.appDomain, order)
    } catch (error) {
      await user.sendErrorGetOrderEmail(
        i18n,
        validatedData.appName,
        validatedData.appDomain,
        error.message,
        order
      )
      throw new InternalServerException('Get order info error')
    }

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
