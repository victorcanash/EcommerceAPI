import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { defaultPage, defaultLimit, defaultOrder, defaultSortBy } from 'App/Constants/Lists'
import Order from 'App/Models/Order'
import OrdersService from 'App/Services/OrdersService'
import UsersService from 'App/Services/UsersService'
import BigbuyService from 'App/Services/BigbuyService'
import { OrderResponse, OrdersResponse } from 'App/Controllers/Http/types'
import PaginationValidator from 'App/Validators/List/PaginationValidator'
import SortValidator from 'App/Validators/List/SortValidator'
import CreateOrderValidator from 'App/Validators/Order/CreateOrderValidator'
import { logRouteSuccess } from 'App/Utils/logger'

export default class OrdersController {
  public async index({ request, response, auth }: HttpContextContract) {
    const email = await UsersService.getAuthEmail(auth)
    const user = await UsersService.getUserByEmail(email, true)

    const validatedPaginationData = await request.validate(PaginationValidator)
    const page = validatedPaginationData.page || defaultPage
    const limit = validatedPaginationData.limit || defaultLimit

    const validatedSortData = await request.validate(SortValidator)
    const sortBy = validatedSortData.sortBy || defaultSortBy
    const order = validatedSortData.order || defaultOrder

    const orders = await Order.query()
      .where('userId', user.id)
      .orderBy(sortBy, order)
      .paginate(page, limit)
    const result = orders.toJSON()

    const successMsg = `Successfully got orders by user ${user.email}`
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

  public async store({ request, response, auth }: HttpContextContract) {
    const email = await UsersService.getAuthEmail(auth)
    const user = await UsersService.getUserByEmail(email, true)

    const validatedData = await request.validate(CreateOrderValidator)

    const order = await Order.create({
      userId: user.id,
      braintreeTransactionId: validatedData.braintreeTransactionId,
    })

    await BigbuyService.createOrder(user, order.id.toString())
      .then(async (_orderId: string) => {})
      .catch(async (error) => {
        await order.delete()
        throw error
      })

    const successMsg = `Successfully created order with braintree transaction id ${validatedData.braintreeTransactionId}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      order: order,
    } as OrderResponse)
  }
}
