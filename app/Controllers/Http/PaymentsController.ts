import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { TransactionRequest } from 'braintree'

import UsersService from 'App/Services/UsersService'
import BraintreeService from 'App/Services/BraintreeService'
import { PaymentResponse } from 'App/Controllers/Http/types'
import CreateTransactionValidator from 'App/Validators/Payment/CreateTransactionValidator'
import { logRouteSuccess } from 'App/Utils/logger'
import PermissionException from 'App/Exceptions/PermissionException'

export default class PaymentsController {
  public async createTransaction({ request, response, auth }: HttpContextContract) {
    const email = await UsersService.getAuthEmail(auth)
    const user = await UsersService.getUserByEmail(email, true)
    if (!user.shipping) {
      throw new PermissionException(`You don't have an existing shipping address`)
    }
    if (!user.billing) {
      throw new PermissionException(`You don't have an existing billing address`)
    }
    if (!user.cart) {
      throw new PermissionException(`You don't have an existing cart`)
    }
    if (user.cart.items && user.cart.items.length <= 0) {
      throw new PermissionException(`You don't have selected items in your cart`)
    }

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
    const customer = braintreeCustomer
      ? undefined
      : {
          firstName: user.firstName,
          lastName: user.lastName,
          // company: "Braintree",
          // phone: "312-555-1234",
          // fax: "312-555-12346",
          // website: "http://www.example.com",
          email: user.email,
        }
    const customerId = braintreeCustomer ? braintreeCustomer.id : undefined

    const transactionRequest: TransactionRequest = {
      amount: user.cart.amount.toString(),
      paymentMethodNonce: validatedData.paymentMethodNonce,
      // deviceData: deviceDataFromTheClient,
      customerId,
      customer,
      billing: {
        firstName: user.billing.firstName,
        lastName: user.billing.lastName,
        // company: "Braintree",
        streetAddress: user.billing.addressLine1,
        extendedAddress: user.billing.addressLine2,
        locality: user.billing.locality,
        // region: "IL",
        postalCode: user.billing.postalCode,
        countryName: user.billing.country,
      },
      shipping: {
        firstName: user.shipping.firstName,
        lastName: user.shipping.lastName,
        // company: "Braintree",
        streetAddress: user.shipping.addressLine1,
        extendedAddress: user.shipping.addressLine2,
        locality: user.shipping.locality,
        // region: "IL",
        postalCode: user.shipping.postalCode,
        countryName: user.shipping.country,
      },
      options: {
        submitForSettlement: true,
        storeInVaultOnSuccess: true,
      },
    }

    const result = await braintreeService.createTransaction(transactionRequest)
    if (!result.success) {
      throw new PermissionException(result.message)
    }

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
      transaction: result.transaction,
      braintreeToken: braintreeToken,
    } as PaymentResponse)
  }
}
