import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import I18n from '@ioc:Adonis/Addons/I18n'

import { defaultPage, defaultLimit, defaultOrder, defaultSortBy } from 'App/Constants/lists'
import Order from 'App/Models/Order'
import OrdersService from 'App/Services/OrdersService'
import UsersService from 'App/Services/UsersService'
import CartsService from 'App/Services/CartsService'
import BigbuyService from 'App/Services/BigbuyService'
import MailService from 'App/Services/MailService'
import { SendOrderProduct } from 'App/Types/order'
import { OrderResponse, OrdersResponse } from 'App/Controllers/Http/types'
import PaginationValidator from 'App/Validators/List/PaginationValidator'
import SortValidator from 'App/Validators/List/SortValidator'
import FilterOrderValidator from 'App/Validators/Order/FilterOrderValidator'
import CreateOrderValidator from 'App/Validators/Order/CreateOrderValidator'
import SendOrderEmailValidator from 'App/Validators/Order/SendOrderEmailValidator'
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

    const user = validatedData.userId
      ? await UsersService.getUserById(validatedData.userId, false)
      : undefined
    if (!user && !validatedData.userEmail) {
      throw new BadRequestException('Missing user email or user id')
    }

    if (!validatedData.products?.items || validatedData.products.items.length <= 0) {
      throw new BadRequestException('Missing products')
    }
    const order = await Order.create({
      userId: user?.id || -1,
      braintreeTransactionId: validatedData.braintreeTransactionId,
    })
    const orderCart = await CartsService.createGuestCartCheck(validatedData.products.items)
    const orderProducts = orderCart.items.map((item) => {
      if (item.quantity > 0) {
        return {
          reference: item.inventory.sku,
          quantity: item.quantity,
          internalReference: item.inventory.id.toString(),
        } as SendOrderProduct
      }
    })

    try {
      await order.loadBraintreeData()
    } catch (error) {
      await order.delete()
      throw new InternalServerException('Braintree error')
    }

    try {
      const bigbuyId = await BigbuyService.createOrder(
        order.id.toString(),
        user?.email || validatedData.userEmail || '',
        validatedData.shipping,
        orderProducts
      )
      order.merge({ bigbuyId })
      await order.save()
    } catch (error) {
      await order.delete()
      throw new InternalServerException(error.message)
    }

    try {
      await order.loadBigbuyData()
      await MailService.sendCheckOrderEmail(
        I18n.locale(locale),
        validatedData.appName,
        validatedData.appDomain,
        user?.email || validatedData.userEmail || '',
        user?.firstName || validatedData.shipping.firstName,
        order
      )
    } catch (error) {
      await MailService.sendErrorGetOrderEmail(
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
    const user =
      order.userId !== -1 ? await UsersService.getUserById(order.userId, false) : undefined

    const validatedData = await request.validate(SendOrderEmailValidator)

    const locale = I18n.getSupportedLocale(validatedData.locale)
    if (!locale) {
      throw new BadRequestException(`Unsupported locale: ${validatedData.locale}`)
    }
    if (!user) {
      if (!validatedData.userEmail) {
        throw new BadRequestException('Missing user email')
      }
      if (!validatedData.userFirstName) {
        throw new BadRequestException('Missing user first name')
      }
    }

    await MailService.sendCheckOrderEmail(
      I18n.locale(locale),
      validatedData.appName,
      validatedData.appDomain,
      user?.email || validatedData.userEmail || '',
      user?.firstName || validatedData.userFirstName || '',
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
