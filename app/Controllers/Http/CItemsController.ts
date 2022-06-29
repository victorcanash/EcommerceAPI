import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import CartItem from 'App/Models/CartItem'
import User from 'App/Models/User'
import { CItemsResponse, CItemResponse, BasicResponse } from 'App/Controllers/Http/types'
import PaginationValidator from 'App/Validators/List/PaginationValidator'
import SortValidator from 'App/Validators/List/SortValidator'
import CreateCItemValidator from 'App/Validators/Cart/CreateCItemValidator'
import UpdateCItemValidator from 'App/Validators/Cart/UpdateCItemValidator'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'
import PermissionException from 'App/Exceptions/PermissionException'
import { logRouteSuccess } from 'App/Utils/logger'

export default class CItemsController {
  public async index({ request, response }: HttpContextContract) {
    const validatedPaginationData = await request.validate(PaginationValidator)
    const page = validatedPaginationData.page || 1
    const limit = validatedPaginationData.limit || 10

    const validatedSortData = await request.validate(SortValidator)
    const sortBy = validatedSortData.sort_by || 'id'
    const order = validatedSortData.order || 'asc'

    const cartItems = await CartItem.query().orderBy(sortBy, order).paginate(page, limit)
    const result = cartItems.toJSON()

    const successMsg = 'Successfully got cart items'
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      cartItems: result.data,
      totalPages: Math.ceil(result.meta.total / limit),
      currentPage: result.meta.current_page as number,
    } as CItemsResponse)
  }

  public async show({ params: { id }, request, response, bouncer }: HttpContextContract) {
    const cartItem = await CartItem.find(id)
    if (!cartItem) {
      throw new ModelNotFoundException(`Invalid id ${id} getting cart item`)
    }

    await bouncer.with('CItemPolicy').authorize('view', cartItem)

    const successMsg = `Successfully got cart item by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      cartItem: cartItem,
    } as CItemResponse)
  }

  public async store({ request, response, auth }: HttpContextContract) {
    const user = await User.find(auth.user?.id)
    if (!user) {
      throw new ModelNotFoundException(`Invalid auth id ${auth.user?.id} creating cart item`)
    }
    await user.load('cart')
    if (!user.cart) {
      throw new PermissionException(`You don't have an existing cart to create a new cart item`)
    }

    const validatedData = await request.validate(CreateCItemValidator)
    validatedData.cartId = user.cart.id

    const cartItem = await CartItem.create(validatedData)

    const successMsg = 'Successfully created cart item'
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      cartItem: cartItem,
    } as CItemResponse)
  }

  public async update({ params: { id }, request, response, bouncer }: HttpContextContract) {
    const cartItem = await CartItem.find(id)
    if (!cartItem) {
      throw new ModelNotFoundException(`Invalid id ${id} updating cart item`)
    }

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
    const cartItem = await CartItem.find(id)
    if (!cartItem) {
      throw new ModelNotFoundException(`Invalid id ${id} deleting cart item`)
    }

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
