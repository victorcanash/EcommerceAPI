import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import I18n from '@ioc:Adonis/Addons/I18n'

import { defaultPage, defaultLimit, defaultOrder, defaultSortBy } from 'App/Constants/Lists'
import Order from 'App/Models/Order'
import OrdersService from 'App/Services/OrdersService'
import UsersService from 'App/Services/UsersService'
import BigbuyService from 'App/Services/BigbuyService'
import ProductsService from 'App/Services/ProductsService'
import { OrderResponse, OrdersResponse } from 'App/Controllers/Http/types'
import PaginationValidator from 'App/Validators/List/PaginationValidator'
import SortValidator from 'App/Validators/List/SortValidator'
import FilterOrderValidator from 'App/Validators/Order/FilterOrderValidator'
import CreateOrderValidator from 'App/Validators/Order/CreateOrderValidator'
import SendCheckOrderEmailValidator from 'App/Validators/Order/SendOrderEmailValidator'
import PermissionException from 'App/Exceptions/PermissionException'
import BadRequestException from 'App/Exceptions/BadRequestException'
import InternalServerException from 'App/Exceptions/InternalServerException'
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

  public async store({ request, response }: HttpContextContract) {
    const validatedData = await request.validate(CreateOrderValidator)

    const locale = I18n.getSupportedLocale(validatedData.locale)
    if (!locale) {
      throw new BadRequestException(`Unsupported locale: ${validatedData.locale}`)
    }

    const user = await UsersService.getUserById(validatedData.userId, false)

    const order = await Order.create({
      userId: user.id,
      braintreeTransactionId: validatedData.braintreeTransactionId,
    })
    const orderProducts = [] as { reference: string; quantity: number; internalReference: string }[]
    for (const item of validatedData.products) {
      const inventory = await ProductsService.getInventoryById(item.inventoryId)
      if (item.quantity > 0) {
        orderProducts.push({
          reference: inventory.sku,
          quantity: item.quantity,
          internalReference: inventory.id.toString(),
        })
      }
    }

    try {
      await order.loadBraintreeData()
    } catch (error) {
      await order.delete()
      throw new InternalServerException('Braintree error')
    }

    try {
      await BigbuyService.createOrder(
        order.id.toString(),
        user.email,
        validatedData.shipping,
        orderProducts
      )
    } catch (error) {
      await order.delete()
      throw new InternalServerException(error.message)
    }

    try {
      await order.loadBigbuyData()
      await user.sendCheckOrderEmail(
        I18n.locale(locale),
        validatedData.appName,
        validatedData.appDomain,
        order
      )
    } catch (error) {
      await user.sendErrorGetOrderEmail(
        I18n.locale(locale),
        validatedData.appName,
        validatedData.appDomain,
        error.message,
        order
      )
      throw new InternalServerException('Get order info error')
    }

    const successMsg = 'Successfully created order'
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      order: order,
    } as OrderResponse)
  }

  public async sendCheckEmail({ params: { id }, request, response }: HttpContextContract) {
    const order = await OrdersService.getOrderById(id, true, true)
    const user = await UsersService.getUserById(order.userId, false)

    const validatedData = await request.validate(SendCheckOrderEmailValidator)

    const locale = I18n.getSupportedLocale(validatedData.locale)
    if (!locale) {
      throw new BadRequestException(`Unsupported locale: ${validatedData.locale}`)
    }

    await user.sendCheckOrderEmail(
      I18n.locale(locale),
      validatedData.appName,
      validatedData.appDomain,
      order
    )

    const successMsg = 'Successfully sent check order email'
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      order: order,
    } as OrderResponse)
  }
}
