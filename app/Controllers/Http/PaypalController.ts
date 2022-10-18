import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'

import axios, { AxiosResponse } from 'axios'

import User from 'App/Models/User'
import Order from 'App/Models/Order'
import OrderItem from 'App/Models/OrderItem'
import { OrderStatus } from 'App/Models/Enums/OrderStatus'
import { PaypalCheckoutOrderResponse, PaypalCaptureOrderResponse } from 'App/Controllers/Http/types'
import CheckoutPaypalOrderValidator from 'App/Validators/Paypal/CheckoutPaypalOrderValidator'
import CapturePaypalOrderValidator from 'App/Validators/Paypal/CapturePaypalOrderValidator'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'
import PermissionException from 'App/Exceptions/PermissionException'
import InternalServerException from 'App/Exceptions/InternalServerException'
import { logRouteSuccess } from 'App/Utils/logger'

export default class PaypalController {
  public async checkoutOrder({ request, response, auth }: HttpContextContract) {
    // Load cart by user
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
    const currencyCode = validatedData.currencyCode || 'EUR'

    // Check cart items and create order
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
    // Create order
    const order = {
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
      .post(`${Env.get('PAYPAL_API')}/v2/checkout/orders`, order, {
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

  public async captureOrder({ request, response, auth }: HttpContextContract) {
    const validatedData = await request.validate(CapturePaypalOrderValidator)

    // Get auth token of paypal API
    let paypalToken = ''
    try {
      paypalToken = await this.generatePaypalToken()
    } catch (error) {
      throw new InternalServerException(error.message)
    }

    // Call capture order endpoint of paypal API
    let responseData
    await axios
      .post(
        `${Env.get('PAYPAL_API')}/v2/checkout/orders/${validatedData.orderToken}/capture`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${paypalToken}`,
          },
        }
      )
      .then((response: AxiosResponse) => {
        if (response.status === 201) {
          responseData = response.data
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
      data: responseData,
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

  /*public async createCheckoutSession({ request, response, auth }: HttpContextContract) {
    // Load cart by user
    const user = await User.query()
      .where('email', auth.user?.email)
      .preload('cart', (query) => {
        query.preload('items', (query) => {
          query.preload('product')
          query.preload('inventory')
        })
      })
      .first()
    if (!user) {
      throw new ModelNotFoundException(`Invalid auth email ${auth.user?.email} getting logged user`)
    }
    if (!user.cart || user.cart.items.length < 1) {
      throw new PermissionException('No items to create a checkout session')
    }

    // Check if there are the quantity desired by user and if there are items with 0 quantity
    // Create lineItems for the checkout session
    const lineItems: any[] = []
    user.cart.items.forEach(async (item) => {
      if (item.quantity > item.inventory.quantity) {
        item.quantity = item.inventory.quantity
        if (item.quantity > 0) {
          await item.save()
        }
      }
      if (item.quantity < 1) {
        await item.delete()
      } else {
        lineItems.push({
          quantity: item.quantity,
          adjustable_quantity: {
            enabled: false,
          },
          price_data: {
            currency: 'eur',
            unit_amount: item.product.realPrice * 100,
            product_data: {
              name: item.product.name,
              description: `${item.product.description} ${
                item.inventory.size ? `(${item.inventory.size})` : ''
              }`,
              images: [`${Env.get('APP_URL', '')}/products/${item.product.id}/images/0`],
              metadata: {
                productId: item.product.id,
              },
            },
          },
        })
      }
    })

    try {
      // Adding customer
      const customersListResponse = await stripeAPI.customers.list({
        email: user.email,
      })
      let customer
      if (customersListResponse.data && customersListResponse.data.length > 0) {
        customer = customersListResponse.data[0]
      } else {
        customer = await stripeAPI.customers.create({
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
        })
      }
      if (!customer) {
        throw new InternalServerException('Cannot get customer to create a new checkout session')
      }

      // Creating checkout session
      const session = await stripeAPI.checkout.sessions.create({
        mode: 'payment',
        line_items: lineItems,
        customer: customer.id,
        success_url: Env.get('STRIPE_SUCCESS_ENDPOINT', ''),
        cancel_url: Env.get('STRIPE_CANCEL_ENDPOINT', ''),
        shipping_address_collection: {
          allowed_countries: ['ES'],
        },
        phone_number_collection: {
          enabled: true,
        },
      })

      const successMsg = `Successfully created checkout session with id ${session.id}`
      logRouteSuccess(request, successMsg)
      return response.created({
        code: 201,
        message: successMsg,
        sessionId: session.id,
      } as StripeResponse)
    } catch (error) {
      logRouteSuccess(request, error.getMessage())
      throw new InternalServerException(error.getMessage())
    }
  }

  public async webhooks({ request, response }: HttpContextContract) {
    const payload = request.raw()
    const sig = request.header('stripe-signature')
    let event
    try {
      event = stripeAPI.webhooks.constructEvent(payload, sig, Env.get('STRIPE_WEBHOOKS_SECRET', ''))
    } catch (err) {
      return response.status(400).send(`Webhook Error: ${err.message}`)
    }

    const session = event.data.object
    switch (event.type) {
      case 'checkout.session.completed': {
        // Save an order in your database, marked as 'awaiting payment'
        const order = await this.createOrder(session)

        // Check if the order is paid (for example, from a card payment)
        //
        // A delayed notification payment will have an `unpaid` status, as
        // you're still waiting for funds to be transferred from the customer's
        // account.
        if (session.payment_status === OrderStatus.PAID) {
          await this.fulfillOrder(session, order)
        }
        break
      }

      case 'checkout.session.async_payment_succeeded': {
        // Fulfill the purchase...
        await this.fulfillOrder(session)
        break
      }

      case 'checkout.session.async_payment_failed': {
        // Send an email to the customer asking them to retry their order
        await this.failedOrder(session)
        break
      }
    }
    const successMsg = `Successfully webhook ${event.type} from stripe`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
    } as BasicResponse)
  }

  private async createOrder(session: any) {
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
  }

  private async fulfillOrder(session: any, order?: Order) {
    let fulfilledOrder = order
    if (!fulfilledOrder) {
      fulfilledOrder = (await Order.query().where('sessionId', session.id).first()) || undefined
    }
    if (!fulfilledOrder) {
      throw new ModelNotFoundException(`Cannot find fulfilled order with session id ${session.id}`)
    }

    fulfilledOrder.status = OrderStatus.PAID
    fulfilledOrder.save()
  }

  private async failedOrder(session: any) {
    const failedOrder = (await Order.query().where('sessionId', session.id).first()) || undefined
    if (!failedOrder) {
      throw new ModelNotFoundException(`Cannot find failed order with session id ${session.id}`)
    }

    failedOrder.status = OrderStatus.FAILED
    failedOrder.save()
  }*/
}
