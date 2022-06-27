import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Cart from 'App/Models/Cart'
import { CartsResponse, CartResponse, BasicResponse } from 'App/Controllers/Http/types'
import PaginationValidator from 'App/Validators/List/PaginationValidator'
import SortValidator from 'App/Validators/List/SortValidator'
import CreateCartValidator from 'App/Validators/Cart/CreateCartValidator'
import UpdateCartValidator from 'App/Validators/Cart/UpdateCartValidator'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'
import { logRouteSuccess } from 'App/Utils/Logger'

export default class CartsController {
  public async index({ request, response }: HttpContextContract) {
    const validatedPaginationData = await request.validate(PaginationValidator)
    const page = validatedPaginationData.page || 1
    const limit = validatedPaginationData.limit || 10

    const validatedSortData = await request.validate(SortValidator)
    const sortBy = validatedSortData.sort_by || 'id'
    const order = validatedSortData.order || 'asc'

    const carts = await Cart.query().orderBy(sortBy, order).paginate(page, limit)
    const result = carts.toJSON()

    const successMsg = 'Successfully got carts'
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      carts: result.data,
      totalPages: Math.ceil(result.meta.total / limit),
      currentPage: result.meta.current_page as number,
    } as CartsResponse)
  }

  public async show({ params: { id }, request, response, bouncer }: HttpContextContract) {
    const cart = await Cart.find(id)
    if (!cart) {
      throw new ModelNotFoundException(`Invalid id ${id} getting cart`)
    }

    await bouncer.with('CartPolicy').authorize('view', cart)

    const successMsg = `Successfully got cart by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      cart: cart,
    } as CartResponse)
  }

  public async store({ request, response, auth, bouncer }: HttpContextContract) {
    await bouncer.with('CartPolicy').authorize('create')

    const validatedData = await request.validate(CreateCartValidator)
    validatedData.userId = auth.user?.id
    validatedData.total ? validatedData.total : 0

    const cart = await Cart.create(validatedData)

    const successMsg = 'Successfully created cart'
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      cart: cart,
    } as CartResponse)
  }

  public async update({ params: { id }, request, response, bouncer }: HttpContextContract) {
    const cart = await Cart.find(id)
    if (!cart) {
      throw new ModelNotFoundException(`Invalid id ${id} updating cart`)
    }

    await bouncer.with('CartPolicy').authorize('update', cart)

    const validatedData = await request.validate(UpdateCartValidator)

    cart.merge(validatedData)
    await cart.save()

    const successMsg = `Successfully updated cart by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      cart: cart,
    } as CartResponse)
  }

  public async destroy({ params: { id }, request, response, bouncer }: HttpContextContract) {
    const cart = await Cart.find(id)
    if (!cart) {
      throw new ModelNotFoundException(`Invalid id ${id} deleting cart`)
    }

    await bouncer.with('CartPolicy').authorize('delete', cart)

    await cart.delete()

    const successMsg = `Successfully deleted cart by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
    } as BasicResponse)
  }
}
