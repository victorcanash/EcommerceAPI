import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import CartItem from 'App/Models/CartItem'
import ProductInventory from 'App/Models/ProductInventory'
import UsersService from 'App/Services/UsersService'
import CartsService from 'App/Services/CartsService'
import { CItemResponse, BasicResponse } from 'App/Controllers/Http/types'
import CreateCItemValidator from 'App/Validators/Cart/CreateCItemValidator'
import UpdateCItemValidator from 'App/Validators/Cart/UpdateCItemValidator'
import { logRouteSuccess } from 'App/Utils/logger'
import PermissionException from 'App/Exceptions/PermissionException'
import BadRequestException from 'App/Exceptions/BadRequestException'

export default class CItemsController {
  public async store({ request, response, auth }: HttpContextContract) {
    const email = await UsersService.getAuthEmail(auth)
    const user = await UsersService.getUserByEmail(email, false)
    await user.load('cart')
    if (!user.cart) {
      throw new PermissionException(`You don't have an existing cart`)
    }

    const validatedData = await request.validate(CreateCItemValidator)
    const productInventory = await ProductInventory.find(validatedData.inventoryId)
    if (productInventory?.productId !== validatedData.productId) {
      throw new BadRequestException('Inventory id must belong to the same product id')
    }

    const cartItem = await CartItem.create({
      cartId: user.cart.id,
      productId: validatedData.productId,
      inventoryId: validatedData.inventoryId,
      quantity: validatedData.quantity,
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
