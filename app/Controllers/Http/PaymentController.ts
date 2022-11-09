import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { TransactionRequest } from 'braintree'

import UsersService from 'App/Services/UsersService'
import BraintreeService from 'App/Services/BraintreeService'
import { PaymentTransactionResponse } from 'App/Controllers/Http/types'
import CreateTransactionValidator from 'App/Validators/Payment/CreateTransactionValidator'
import { logRouteSuccess } from 'App/Utils/logger'

export default class PaymentController {
  public async createTransaction({ request, response, auth }: HttpContextContract) {
    const email = await UsersService.getAuthEmail(auth)
    const user = await UsersService.getUserByEmail(email, false)

    const validatedData = await request.validate(CreateTransactionValidator)

    const braintreeService = new BraintreeService()
    const braintreeCustomer = await braintreeService.getCustomer(user.braintreeId)

    /*const customer = braintreeCustomer
      ? undefined
      : {
          firstName: user.firstName,
          lastName: user.lastName,
          // company: "Braintree",
          // phone: "312-555-1234",
          // fax: "312-555-12346",
          // website: "http://www.example.com",
          email: user.email,
        }*/
    const customer = {
      firstName: user.firstName,
      lastName: user.lastName,
      // company: "Braintree",
      // phone: "312-555-1234",
      // fax: "312-555-12346",
      // website: "http://www.example.com",
      email: user.email,
    }
    const customerId = braintreeCustomer ? braintreeCustomer.id : undefined
    const billing = validatedData.billing
    const shipping = validatedData.shipping
    const transactionRequest: TransactionRequest = {
      amount: '10',
      paymentMethodNonce: validatedData.paymentMethodNonce,
      // deviceData: deviceDataFromTheClient,
      customerId,
      customer,
      billing: {
        firstName: billing.firstName,
        lastName: billing.lastName,
        // company: "Braintree",
        streetAddress: billing.addressLine1,
        extendedAddress: billing.addressLine2,
        locality: billing.locality,
        // region: "IL",
        postalCode: billing.postalCode,
        countryName: billing.country,
      },
      shipping: {
        firstName: shipping.firstName,
        lastName: shipping.lastName,
        // company: "Braintree",
        streetAddress: shipping.addressLine1,
        extendedAddress: shipping.addressLine2,
        locality: shipping.locality,
        // region: "IL",
        postalCode: shipping.postalCode,
        countryName: shipping.country,
      },
      options: {
        submitForSettlement: true,
        storeInVaultOnSuccess: true,
      },
    }

    const result = await braintreeService.createTransaction(transactionRequest)

    user.merge({
      braintreeId: result.customer.id,
    })
    await user.save()

    const successMsg = `Successfully created transaction with user email ${email}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      transaction: result,
    } as PaymentTransactionResponse)
  }

  // Create checkout order
  /*public async checkoutOrder({ request, response, auth }: HttpContextContract) {
    const email = await UsersService.getAuthEmail(auth)

    const validatedData = await request.validate(CheckoutPaypalOrderValidator)
    const currencyCode = validatedData.currencyCode || defaultCurrencyCode

    // Create paypal items
    const paypalItems: any[] = []
    let totalItemsAmount = 0
    let totalItemsTax = 0
    const changedCartItems = await CartsService.checkItemsQuantity(email, (item) => {
      const product = item.product.serialize()
      paypalItems.push({
        name: product.name,
        description: `${product.description} ${
          item.inventory.size ? `(${item.inventory.size})` : ''
        }`,
        sku: product.sku,
        quantity: item.quantity,
        unit_amount: {
          currency_code: currencyCode,
          value: product.realPrice,
        },
        tax: {
          currency_code: currencyCode,
          value: 0,
        },
      })
      totalItemsAmount += product.realPrice * item.quantity
      totalItemsTax += 0 * item.quantity
    })
    if (paypalItems.length < 1) {
      throw new PermissionException('No items to checkout a paypal order')
    }

    // Create paypal order
    const paypalOrder = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          items: paypalItems,
          amount: {
            currency_code: currencyCode,
            value: totalItemsAmount,
            breakdown: {
              item_total: {
                currency_code: currencyCode,
                value: totalItemsAmount,
                discount: {
                  currency_code: currencyCode,
                  value: 0,
                },
                handling: {
                  currency_code: currencyCode,
                  value: 0,
                },
                item_total: {
                  currency_code: currencyCode,
                  value: totalItemsAmount,
                },
                shipping: {
                  currency_code: currencyCode,
                  value: 0,
                },
                shipping_discount: {
                  currency_code: currencyCode,
                  value: 0,
                },
                tax_total: {
                  currency_code: currencyCode,
                  value: totalItemsTax,
                },
              },
            },
          },
          description: 'Purchase from EcommerceVC',
          payment_instruction: {
            disbursement_mode: 'INSTANT',
          },
          shipping: {
            type: 'SHIPPING',
          },
        },
      ],
      application_context: {
        brand_name: 'EcommerceVC',
        user_action: 'PAY_NOW',
        // return_url: validatedData.returnUrl,
        // cancel_url: validatedData.cancelUrl,
        // locale: 'es-ES',
        payment_method: {
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
        },
      },
    }

    const paypalAccessToken = await PaypalService.getAccessToken()

    const orderId = await PaypalService.checkoutOrder(paypalAccessToken, paypalOrder)

    const successMsg = `Successfully checked out paypal order for user with email ${email}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      orderId: orderId,
      changedCartItems: changedCartItems,
    } as PaypalCheckoutOrderResponse)
  }

  // When order is paid
  public async captureOrder({ request, response, auth }: HttpContextContract) {
    const validatedData = await request.validate(CapturePaypalOrderValidator)

    const paypalAccessToken = await PaypalService.getAccessToken()

    const data = await PaypalService.captureOrder(paypalAccessToken, validatedData.orderId)

    const successMsg = `Successfully captured paypal order for user with email ${auth.user?.email}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      data: data,
    } as PaypalCaptureOrderResponse)
  }

  // Refund all or partial order
  public async refundOrder({ request, response, auth }: HttpContextContract) {
    const validatedData = await request.validate(RefundPaypalOrderValidator)
    const currencyCode = validatedData.currencyCode || defaultCurrencyCode

    const paypalAccessToken = await PaypalService.getAccessToken()

    // Call get order details endpoint of paypal API
    let captureId
    await axios
      .post(
        `${Env.get('PAYPAL_API')}/v2/checkout/orders/${validatedData.paypalOrderId}`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${paypalAccessToken}`,
            'Prefer': 'return=representation',
          },
        }
      )
      .then((response: AxiosResponse) => {
        if (response.status === 201) {
          let captures = response.data.purchase_units?.payments?.captures
          if (captures.length > 0 && captures[0].id) {
            captureId = response.data.purchase_units.payments.captures[0].id
          } else {
            throw new InternalServerException('No capture found')
          }
        } else {
          throw new InternalServerException('Something went wrong')
        }
      })
      .catch((error: Error) => {
        throw new InternalServerException(error.message)
      })

    // Call refund order endpoint of paypal API
    const payload = {
      amount: {
        value: validatedData.amount,
        currency_code: currencyCode,
      },
      // invoice_id: '',
      note_to_payer: validatedData.noteToPlayer,
    }
    let data
    await axios
      .post(`${Env.get('PAYPAL_API')}/v2/payments/captures/${captureId}/refund`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${paypalAccessToken}`,
          'Prefer': 'return=representation',
        },
      })
      .then((response: AxiosResponse) => {
        if (response.status === 201) {
          data = response.data
        }
      })
      .catch((error: Error) => {
        throw new InternalServerException(error.message)
      })

    const successMsg = `Successfully refunded paypal order for user with email ${auth.user?.email}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      data: data,
    } as PaypalCaptureOrderResponse)
  }*/

  /*private async createOrder(session: any) {
    const paymentIntent = await stripeAPI.paymentIntents.retrieve(session.payment_intent, {
      expand: ['payment_method'],
    })
    const items = await stripeAPI.checkout.sessions.listLineItems(session.id, {
      expand: ['data.price.product'],
    })

    try {
      const order = await Order.create({
        status: OrderStatus.UNPAID,
        sessionId: session.id,
        customerEmail: session.customer_details.email,
        customerPhone: session.customer_details.phone,
        amountDiscount: session.total_details.amount_discount,
        amountShipping: session.total_details.amount_shipping,
        amountSubtotal: session.amount_subtotal,
        amountTotal: session.amount_total,
        currency: session.currency,
        shippingName: session.shipping.name,
        shippingCity: session.shipping.address.city,
        shippingCountry: session.shipping.address.country,
        shippingLine1: session.shipping.address.line1,
        shippingLine2: session.shipping.address.line2 || undefined,
        shippingPostalCode: session.shipping.address.postal_code,
        shippingState: session.shipping.address.state,
        paymentType: paymentIntent.payment_method.type,
        last4digits:
          paymentIntent.payment_method[paymentIntent.payment_method.type]?.last4 || undefined,
        billingName: paymentIntent.payment_method.billing_details.name,
        billingCity: paymentIntent.payment_method.billing_details.address.city,
        billingCountry: paymentIntent.payment_method.billing_details.address.country,
        billingLine1: paymentIntent.payment_method.billing_details.address.line1,
        billingLine2: paymentIntent.payment_method.billing_details.address.line2 || undefined,
        billingPostalCode: paymentIntent.payment_method.billing_details.address.postal_code,
        billingState: paymentIntent.payment_method.billing_details.address.state,
      })

      for (let i = 0; i < items.data.length; i++) {
        let item = items.data[i]
        await OrderItem.create({
          orderId: order.id,
          name: item.price.product.name,
          description: item.price.product.description,
          productId: item.price.product.metadata.productId,
          unitAmount: item.price.unit_amount / 100,
          quantity: item.quantity,
        })
      }

      return order
    } catch (e) {
      throw new InternalServerException(e.message)
    }
  }*/
}
