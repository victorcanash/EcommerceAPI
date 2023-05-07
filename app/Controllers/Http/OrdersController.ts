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
import PaginationValidator from 'App/Validators/List/PaginationValidator'
import SortValidator from 'App/Validators/List/SortValidator'
import FilterOrderValidator from 'App/Validators/Order/FilterOrderValidator'
import CreateAdminOrderValidator from 'App/Validators/Order/CreateAdminOrderValidator'
import SendOrderBreakdownEmailValidator from 'App/Validators/Order/SendOrderBreakdownEmailValidator'
import SendOrderIssuedEmailValidator from 'App/Validators/Order/SendOrderIssuedEmailValidator'
import SendOrderReviewEmailValidator from 'App/Validators/Order/SendOrderReviewEmailValidator'
import PermissionException from 'App/Exceptions/PermissionException'

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

  public async store({ request, response }: HttpContextContract) {
    const validatedData = await request.validate(CreateAdminOrderValidator)

    const order = await OrdersService.createOrderByAdminRoute(
      validatedData.locale,
      validatedData.checkoutData as CheckoutData,
      validatedData.cart as GuestCart,
      validatedData.paypalTransactionId,
      validatedData.currency
    )

    const successMsg = 'Successfully created order by admin'
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      order: order,
    } as OrderResponse)
  }

  public async sendOrderBreakdownEmail({ params: { id }, request, response }: HttpContextContract) {
    const validatedData = await request.validate(SendOrderBreakdownEmailValidator)

    const { locale, order, user } = await OrdersService.checkSendOrderEmailData(
      id,
      validatedData.locale
    )

    await MailService.sendOrderBreakdownEmail(
      I18n.locale(locale),
      user.email,
      (user as User)?.firstName || order.bigbuyData?.shippingAddress?.firstName || '',
      order,
      validatedData.currency
    )

    const successMsg = 'Successfully sent order breakdown email'
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      order: order,
    } as OrderResponse)
  }

  public async sendOrderIssuedEmail({ params: { id }, request, response }: HttpContextContract) {
    const validatedData = await request.validate(SendOrderIssuedEmailValidator)

    const { locale, order, user } = await OrdersService.checkSendOrderEmailData(
      id,
      validatedData.locale
    )

    await MailService.sendOrderIssuedEmail(
      I18n.locale(locale),
      user.email,
      (user as User)?.firstName || order.bigbuyData?.shippingAddress?.firstName || '',
      order
    )

    const successMsg = 'Successfully sent order issued email'
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      order: order,
    } as OrderResponse)
  }

  public async sendOrderReviewEmail({ params: { id }, request, response }: HttpContextContract) {
    const validatedData = await request.validate(SendOrderReviewEmailValidator)

    const { locale, order, user } = await OrdersService.checkSendOrderEmailData(
      id,
      validatedData.locale
    )

    await MailService.sendOrderReviewEmail(
      I18n.locale(locale),
      user.email,
      (user as User)?.firstName || order.bigbuyData?.shippingAddress?.firstName || '',
      order
    )

    const successMsg = 'Successfully sent order review email'
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      order: order,
    } as OrderResponse)
  }
}
