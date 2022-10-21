import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'

import axios, { AxiosResponse } from 'axios'

import User from 'App/Models/User'
import { PaypalCheckoutOrderResponse, PaypalCaptureOrderResponse } from 'App/Controllers/Http/types'
import CheckoutPaypalOrderValidator from 'App/Validators/Paypal/CheckoutPaypalOrderValidator'
import CapturePaypalOrderValidator from 'App/Validators/Paypal/CapturePaypalOrderValidator'
import RefundPaypalOrderValidator from 'App/Validators/Paypal/RefundPaypalOrderValidator'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'
import PermissionException from 'App/Exceptions/PermissionException'
import InternalServerException from 'App/Exceptions/InternalServerException'
import { logRouteSuccess } from 'App/Utils/logger'

export default class PaypalController {
  private readonly defaultCurrencyCode = 'EUR'

  // Create checkout order
  public async checkoutOrder({ request, response, auth }: HttpContextContract) {
    // Load user
    const user = await User.query()
      .where('email', auth.user?.email)
      .preload('cart', (query) => {
        query.preload('items', (query) => {
          query.preload('product', (query) => {
            query.preload('activeDiscount')
          })
          query.preload('inventory')
        })
      })
      .first()
    if (!user) {
      throw new ModelNotFoundException(
        `Invalid auth email ${auth.user?.email} to checkout a paypal order`
      )
    }
    if (!user.cart || user.cart.items.length < 1) {
      throw new PermissionException('No items to checkout a paypal order')
    }

    // Validate
    const validatedData = await request.validate(CheckoutPaypalOrderValidator)
    const currencyCode = validatedData.currencyCode || this.defaultCurrencyCode

    // Check cart items and create paypal order
    const items: any[] = []
    let totalItemsAmount = 0
    let totalItemsTax = 0
    user.cart.items.forEach(async (item) => {
      // Check if there are the quantity desired by user and if there are items with 0 quantity
      if (item.quantity > item.inventory.quantity) {
        item.quantity = item.inventory.quantity
        if (item.quantity > 0) {
          await item.save()
        }
      }
      if (item.quantity < 1) {
        await item.delete()
      } else {
        // Create items for the order
        const product = item.product.serialize()
        items.push({
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
      }
    })
    // Create paypal order
    const paypalOrder = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          items: items,
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
        return_url: validatedData.returnUrl,
        cancel_url: validatedData.cancelUrl,
        locale: 'es-ES',
        payment_method: {
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
        },
      },
    }

    // Get auth token of paypal API
    let paypalToken = ''
    try {
      paypalToken = await this.generatePaypalToken()
    } catch (error) {
      throw new InternalServerException(error.message)
    }

    // Call create order endpoint of paypal API
    let checkoutUrl = ''
    await axios
      .post(`${Env.get('PAYPAL_API')}/v2/checkout/orders`, paypalOrder, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${paypalToken}`,
        },
      })
      .then((response: AxiosResponse) => {
        if (response.status === 201) {
          response.data.links.forEach((link) => {
            if (link.rel === 'approve') {
              checkoutUrl = link.href
              return
            }
          })
        }
      })
      .catch((error: Error) => {
        throw new InternalServerException(error.message)
      })

    const successMsg = `Successfully checked out paypal order for user with email ${auth.user?.email}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      checkoutUrl: checkoutUrl,
    } as PaypalCheckoutOrderResponse)
  }

  // When order is paid
  public async captureOrder({ request, response, auth }: HttpContextContract) {
    // Validate
    const validatedData = await request.validate(CapturePaypalOrderValidator)

    // Get auth token of paypal API
    let paypalToken = ''
    try {
      paypalToken = await this.generatePaypalToken()
    } catch (error) {
      throw new InternalServerException(error.message)
    }

    // Call capture order endpoint of paypal API
    let paypalOrder
    await axios
      .post(
        `${Env.get('PAYPAL_API')}/v2/checkout/orders/${validatedData.orderToken}/capture`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${paypalToken}`,
            'Prefer': 'return=representation',
          },
        }
      )
      .then((response: AxiosResponse) => {
        if (response.status === 201) {
          paypalOrder = response.data
        }
      })
      .catch((error: Error) => {
        throw new InternalServerException(error.message)
      })

    const successMsg = `Successfully captured paypal order for user with email ${auth.user?.email}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      paypalOrder: paypalOrder,
    } as PaypalCaptureOrderResponse)
  }

  public async refundOrder({ request, response, auth }: HttpContextContract) {
    // Validate
    const validatedData = await request.validate(RefundPaypalOrderValidator)
    const currencyCode = validatedData.currencyCode || this.defaultCurrencyCode

    // Get auth token of paypal API
    let paypalToken = ''
    try {
      paypalToken = await this.generatePaypalToken()
    } catch (error) {
      throw new InternalServerException(error.message)
    }

    // Call get order details endpoint of paypal API
    let captureId
    await axios
      .post(
        `${Env.get('PAYPAL_API')}/v2/checkout/orders/${validatedData.paypalOrderId}`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${paypalToken}`,
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
    let paypalOrder
    await axios
      .post(`${Env.get('PAYPAL_API')}/v2/payments/captures/${captureId}/refund`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${paypalToken}`,
          'Prefer': 'return=representation',
        },
      })
      .then((response: AxiosResponse) => {
        if (response.status === 201) {
          paypalOrder = response.data
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
      paypalOrder: paypalOrder,
    } as PaypalCaptureOrderResponse)
  }

  private async generatePaypalToken() {
    const params = new URLSearchParams()
    params.append('grant_type', 'client_credentials')
    let paypalToken = ''
    await axios
      .post(`${Env.get('PAYPAL_API')}/v1/oauth2/token`, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        auth: {
          username: Env.get('PAYPAL_CLIENT_ID', ''),
          password: Env.get('PAYPAL_CLIENT_SECRET', ''),
        },
      })
      .then((response: AxiosResponse) => {
        paypalToken = response.data.access_token
      })
      .catch((error: Error) => {
        throw error
      })

    return paypalToken
  }

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
