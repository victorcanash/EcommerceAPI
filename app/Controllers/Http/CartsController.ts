import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Cart from 'App/Models/Cart'
import UsersService from 'App/Services/UsersService'
import CartsService from 'App/Services/CartsService'
import { GuestCartCheck, GuestCartCheckItem } from 'App/Types/cart'
import { CheckCartResponse } from 'App/Controllers/Http/types'
import CheckCartValidator from 'App/Validators/Cart/CheckCartValidator'
import { logRouteSuccess } from 'App/Utils/logger'

export default class CartsController {
  public async check({ params: { id }, request, response, auth, bouncer }: HttpContextContract) {
    let cart: Cart | GuestCartCheck | undefined

    const validToken = await auth.use('api').check()
    if (validToken) {
      cart = await CartsService.getCartById(id)

      await bouncer.with('CartPolicy').authorize('check', cart as Cart)

      cart = await (await UsersService.getUserById((cart as Cart).userId, true)).cart
    } else {
      const validatedCheckCartData = await request.validate(CheckCartValidator)

      cart = await CartsService.createGuestCartCheck(validatedCheckCartData.guestCart?.items)
    }

    let changedItemsByInventory = [] as GuestCartCheckItem[]
    changedItemsByInventory = await CartsService.checkCartItemsQuantity(cart)

    let successMsg = 'Successfully checked cart'
    if (validToken) {
      successMsg += ` by id ${id}`
    }
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      cart,
      changedItemsByInventory,
    } as CheckCartResponse)
  }
}
