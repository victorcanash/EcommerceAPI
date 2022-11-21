import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import CartItem from 'App/Models/CartItem'
import UsersService from 'App/Services/UsersService'
import CartsService from 'App/Services/CartsService'
import { CItemResponse, BasicResponse } from 'App/Controllers/Http/types'
import CreateCItemValidator from 'App/Validators/Cart/CreateCItemValidator'
import UpdateCItemValidator from 'App/Validators/Cart/UpdateCItemValidator'
import { logRouteSuccess } from 'App/Utils/logger'
import PermissionException from 'App/Exceptions/PermissionException'

export default class CItemsController {
  public async store({ request, response, auth }: HttpContextContract) {
    const email = await UsersService.getAuthEmail(auth)
    const user = await UsersService.getUserByEmail(email, false)
    await user.load('cart')
    if (!user.cart) {
      throw new PermissionException(`You don't have an existing cart`)
    }

    const validatedData = await request.validate(CreateCItemValidator)

    const cartItem = await CartItem.create({
      ...validatedData,
      cartId: user.cart.id,
    })

    const successMsg = 'Successfully created cart item'
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      cartItem: cartItem,
    } as CItemResponse)
  }

  public async update({ params: { id }, request, response, bouncer }: HttpContextContract) {
    const cartItem = await CartsService.getCartItemById(id)

    await bouncer.with('CItemPolicy').authorize('update', cartItem)

    const validatedData = await request.validate(UpdateCItemValidator)

    cartItem.merge(validatedData)
    await cartItem.save()

    const successMsg = `Successfully updated cart item by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      cartItem: cartItem,
    } as CItemResponse)
  }

  public async destroy({ params: { id }, request, response, bouncer }: HttpContextContract) {
    const cartItem = await CartsService.getCartItemById(id)

    await bouncer.with('CItemPolicy').authorize('delete', cartItem)

    await cartItem.delete()

    const successMsg = `Successfully deleted cart item by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
    } as BasicResponse)
  }
}
