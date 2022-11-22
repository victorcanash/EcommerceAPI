import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { defaultPage, defaultLimit, defaultOrder, defaultSortBy } from 'App/Constants/Lists'
import Order from 'App/Models/Order'
import OrdersService from 'App/Services/OrdersService'
import UsersService from 'App/Services/UsersService'
import { OrderResponse, OrdersResponse } from 'App/Controllers/Http/types'
import PaginationValidator from 'App/Validators/List/PaginationValidator'
import SortValidator from 'App/Validators/List/SortValidator'
import FilterOrderValidator from 'App/Validators/Order/FilterOrderValidator'
import PermissionException from 'App/Exceptions/PermissionException'
import { logRouteSuccess } from 'App/Utils/logger'

export default class OrdersController {
  public async index({ request, response, auth, bouncer }: HttpContextContract) {
    const validatedPaginationData = await request.validate(PaginationValidator)
    const page = validatedPaginationData.page || defaultPage
    const limit = validatedPaginationData.limit || defaultLimit

    const validatedSortData = await request.validate(SortValidator)
    const sortBy = validatedSortData.sortBy || defaultSortBy
    const order = validatedSortData.order || defaultOrder

    const validatedFilterData = await request.validate(FilterOrderValidator)
    const userId = validatedFilterData.userId || -1

    if (userId !== -1) {
      const user = await UsersService.getUserById(userId, false)
      await bouncer.with('UserPolicy').authorize('view', user)
    } else {
      const isAuth = await UsersService.isAuthAdmin(auth)
      if (!isAuth) {
        throw new PermissionException(`You have to be an admin to get all orders`)
      }
    }

    const orders = await Order.query()
      .where((query) => {
        if (userId !== -1) {
          query.where('userId', userId)
        }
      })
      .orderBy(sortBy, order)
      .paginate(page, limit)
    const result = orders.toJSON()

    const successMsg = 'Successfully got orders'
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      orders: result.data,
      totalPages: Math.ceil(result.meta.total / limit),
      currentPage: result.meta.current_page as number,
    } as OrdersResponse)
  }

  public async show({ params: { id }, request, response, bouncer }: HttpContextContract) {
    const order = await OrdersService.getOrderById(id, true, true)

    await bouncer.with('OrderPolicy').authorize('view', order)

    const successMsg = `Successfully got order by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      order: order,
    } as OrderResponse)
  }
}
