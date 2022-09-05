import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'

import User from 'App/Models/User'
import { StripeResponse } from 'App/Controllers/Http/types'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'
import PermissionException from 'App/Exceptions/PermissionException'
import InternalServerException from 'App/Exceptions/InternalServerException'
import { logRouteSuccess } from 'App/Utils/logger'

const stripeAPI = require('stripe')(Env.get('STRIPE_SECRET', ''))

export default class StripeController {
  public async createCheckoutSession({ request, response, auth }: HttpContextContract) {
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
              description: item.product.description,
              images: [`${Env.get('APP_URL', '')}/products/${item.product.id}/images/0}`],
            },
          },
        })
      }
    })

    // Creating checkout session
    try {
      const session = await stripeAPI.checkout.sessions.create({
        mode: 'payment',
        line_items: lineItems,
        customer_email: user.email,
        success_url: Env.get('STRIPE_SUCCESS_ENDPOINT', ''),
        cancel_url: Env.get('STRIPE_CANCEL_ENDPOINT', ''),
        shipping_address_collection: { allowed_countries: 'ES' },
      })

      const successMsg = `Successfully created checkout session with id ${session.id}`
      logRouteSuccess(request, successMsg)
      return response.created({
        code: 201,
        message: successMsg,
        sessionId: session.id,
      } as StripeResponse)
    } catch (error) {
      throw new InternalServerException(error.message)
    }
  }
}
