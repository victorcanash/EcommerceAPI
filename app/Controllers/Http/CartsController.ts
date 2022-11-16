import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import UsersService from 'App/Services/UsersService'
import CartsService from 'App/Services/CartsService'
import { CheckCartResponse } from 'App/Controllers/Http/types'
import { logRouteSuccess } from 'App/Utils/logger'

export default class CartsController {
  public async check({ params: { id }, request, response, bouncer }: HttpContextContract) {
    let cart = await CartsService.getCartById(id)

    await bouncer.with('CartPolicy').authorize('check', cart)

    const { changedItems, deletedItems } = await CartsService.checkCartItemsQuantity(cart)

    const user = await UsersService.getUserById(cart.userId, true)

    const successMsg = `Successfully checked cart by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      cart: user.cart,
      changedItems: changedItems,
      deletedItems: deletedItems,
    } as CheckCartResponse)
  }
}
