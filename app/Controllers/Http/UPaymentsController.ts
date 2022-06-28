import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import UserPayment from 'App/Models/UserPayment'
import { UPaymentsResponse, UPaymentResponse, BasicResponse } from 'App/Controllers/Http/types'
import PaginationValidator from 'App/Validators/List/PaginationValidator'
import SortValidator from 'App/Validators/List/SortValidator'
import CreateUPaymentValidator from 'App/Validators/User/CreateUPaymentValidator'
import UpdateUPaymentValidator from 'App/Validators/User/UpdateUPaymentValidator'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'
import { logRouteSuccess } from 'App/utils/logger'

export default class UPaymentsController {
  public async index({ request, response }: HttpContextContract) {
    const validatedPaginationData = await request.validate(PaginationValidator)
    const page = validatedPaginationData.page || 1
    const limit = validatedPaginationData.limit || 10

    const validatedSortData = await request.validate(SortValidator)
    const sortBy = validatedSortData.sort_by || 'id'
    const order = validatedSortData.order || 'asc'

    const userPayments = await UserPayment.query().orderBy(sortBy, order).paginate(page, limit)
    const result = userPayments.toJSON()

    const successMsg = 'Successfully got user payments'
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      userPayments: result.data,
      totalPages: Math.ceil(result.meta.total / limit),
      currentPage: result.meta.current_page as number,
    } as UPaymentsResponse)
  }

  public async show({ params: { id }, request, response, bouncer }: HttpContextContract) {
    const userPayment = await UserPayment.find(id)
    if (!userPayment) {
      throw new ModelNotFoundException(`Invalid id ${id} getting user payment`)
    }

    await bouncer.with('UPaymentPolicy').authorize('view', userPayment)

    const successMsg = `Successfully got user payment by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      userPayment: userPayment,
    } as UPaymentResponse)
  }

  public async store({ request, response, auth }: HttpContextContract) {
    const validatedData = await request.validate(CreateUPaymentValidator)
    validatedData.userId = auth.user?.id

    const userPayment = await UserPayment.create(validatedData)

    const successMsg = 'Successfully created user payment'
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      userPayment: userPayment,
    } as UPaymentResponse)
  }

  public async update({ params: { id }, request, response, bouncer }: HttpContextContract) {
    const userPayment = await UserPayment.find(id)
    if (!userPayment) {
      throw new ModelNotFoundException(`Invalid id ${id} updating user payment`)
    }

    await bouncer.with('UPaymentPolicy').authorize('update', userPayment)

    const validatedData = await request.validate(UpdateUPaymentValidator)

    userPayment.merge(validatedData)
    await userPayment.save()

    const successMsg = `Successfully updated user payment by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      userPayment: userPayment,
    } as UPaymentResponse)
  }

  public async destroy({ params: { id }, request, response, bouncer }: HttpContextContract) {
    const userPayment = await UserPayment.find(id)
    if (!userPayment) {
      throw new ModelNotFoundException(`Invalid id ${id} deleting user payment`)
    }

    await bouncer.with('UPaymentPolicy').authorize('delete', userPayment)

    await userPayment.delete()

    const successMsg = `Successfully deleted user payment by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
    } as BasicResponse)
  }
}
