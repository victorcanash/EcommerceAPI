import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import I18n from '@ioc:Adonis/Addons/I18n'

import { defaultPage, defaultLimit, defaultOrder, defaultSortBy } from 'App/Constants/lists'
import Order from 'App/Models/Order'
import User from 'App/Models/User'
import { CheckoutData } from 'App/Types/checkout'
import { GuestCart } from 'App/Types/cart'
import { OrderResponse, OrdersResponse } from 'App/Controllers/Http/types'
import OrdersService from 'App/Services/OrdersService'
import UsersService from 'App/Services/UsersService'
import MailService from 'App/Services/MailService'
import { logRouteSuccess } from 'App/Utils/logger'
import { getSupportedLocale } from 'App/Utils/localization'
import PaginationValidator from 'App/Validators/List/PaginationValidator'
import SortValidator from 'App/Validators/List/SortValidator'
import FilterOrderValidator from 'App/Validators/Order/FilterOrderValidator'
import CreateAdminOrderValidator from 'App/Validators/Order/CreateAdminOrderValidator'
import SendOrderEmailValidator from 'App/Validators/Order/SendOrderEmailValidator'
import PermissionException from 'App/Exceptions/PermissionException'
import BadRequestException from 'App/Exceptions/BadRequestException'

export default class OrdersController {
  public async index({ request, response, auth, bouncer }: HttpContextContract) {
    const validatedPaginationData = await request.validate(PaginationValidator)
    const page = validatedPaginationData.page || defaultPage
    const limit = validatedPaginationData.limit || defaultLimit

    const validatedSortData = await request.validate(SortValidator)
    const sortBy = validatedSortData.sortBy || defaultSortBy
    const order = validatedSortData.order || defaultOrder

    const validatedFilterData = await request.validate(FilterOrderValidator)
    const userId = validatedFilterData.userId
    if (userId) {
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
        if (userId) {
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

  public async show(ctx: HttpContextContract) {
    const {
      params: { id },
      request,
      response,
    } = ctx

    const validatedFilterData = await request.validate(FilterOrderValidator)

    const order = await OrdersService.showOrder(
      ctx,
      id,
      validatedFilterData.bigbuyId,
      validatedFilterData.guestUserEmail
    )

    const successMsg = `Successfully got order by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      order: order,
    } as OrderResponse)
  }

  public async storeAdmin({ request, response }: HttpContextContract) {
    const validatedData = await request.validate(CreateAdminOrderValidator)
    if (!validatedData.locale) {
      throw new BadRequestException(`Unsupported locale: ${validatedData.locale}`)
    }
    const locale = getSupportedLocale(validatedData.locale)

    const order = await OrdersService.createOrderByAdminRoute(
      locale,
      validatedData.appName,
      validatedData.appDomain,
      validatedData.checkoutData as CheckoutData,
      validatedData.cart as GuestCart,
      validatedData.paypalTransactionId
    )

    const successMsg = 'Successfully created order by admin'
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      order: order,
    } as OrderResponse)
  }

  public async sendCheckEmail({ params: { id }, request, response }: HttpContextContract) {
    const order = await OrdersService.getOrderById(id, true, true, true)
    const user = order.userId
      ? await UsersService.getUserById(order.userId, false)
      : await UsersService.getGuestUserById(order.guestUserId || -1)

    const validatedData = await request.validate(SendOrderEmailValidator)
    if (!validatedData.locale) {
      throw new BadRequestException(`Unsupported locale: ${validatedData.locale}`)
    }
    const locale = getSupportedLocale(validatedData.locale)

    await MailService.sendCheckOrderEmail(
      I18n.locale(locale),
      validatedData.appName,
      validatedData.appDomain,
      user.email,
      (user as User)?.firstName || order.bigbuyData?.shippingAddress?.firstName || '',
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
