import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import ProductDiscount from 'App/Models/ProductDiscount'
import { PDiscountsResponse, PDiscountResponse, BasicResponse } from 'App/Controllers/Http/types'
import PaginationValidator from 'App/Validators/List/PaginationValidator'
import SortValidator from 'App/Validators/List/SortValidator'
import CreatePDiscountValidator from 'App/Validators/Product/CreatePDiscountValidator'
import UpdatePDiscountValidator from 'App/Validators/Product/UpdatePDiscountValidator'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'
import { logRouteSuccess } from 'App/Utils/logger'

export default class PDiscountsController {
  public async index({ request, response }: HttpContextContract) {
    const validatedPaginationData = await request.validate(PaginationValidator)
    const page = validatedPaginationData.page || 1
    const limit = validatedPaginationData.limit || 10

    const validatedSortData = await request.validate(SortValidator)
    const sortBy = validatedSortData.sortBy || 'id'
    const order = validatedSortData.order || 'asc'

    const productDiscounts = await ProductDiscount.query()
      .orderBy(sortBy, order)
      .paginate(page, limit)
    const result = productDiscounts.toJSON()

    const successMsg = 'Successfully got product discounts'
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      productDiscounts: result.data,
      totalPages: Math.ceil(result.meta.total / limit),
      currentPage: result.meta.current_page as number,
    } as PDiscountsResponse)
  }

  public async show({ params: { id }, request, response }: HttpContextContract) {
    const productDiscount = await ProductDiscount.find(id)
    if (!productDiscount) {
      throw new ModelNotFoundException(`Invalid id ${id} getting product discount`)
    }

    const successMsg = `Successfully got product discount by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      productDiscount: productDiscount,
    } as PDiscountResponse)
  }

  public async store({ request, response }: HttpContextContract) {
    const validatedData = await request.validate(CreatePDiscountValidator)

    const productDiscount = await ProductDiscount.create(validatedData)

    const successMsg = 'Successfully created product discount'
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      productDiscount: productDiscount,
    } as PDiscountResponse)
  }

  public async update({ params: { id }, request, response }: HttpContextContract) {
    const productDiscount = await ProductDiscount.find(id)
    if (!productDiscount) {
      throw new ModelNotFoundException(`Invalid id ${id} updating product discount`)
    }

    const validatedData = await request.validate(UpdatePDiscountValidator)

    productDiscount.merge(validatedData)
    await productDiscount.save()

    const successMsg = `Successfully updated product discount by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      productDiscount: productDiscount,
    } as PDiscountResponse)
  }

  public async destroy({ params: { id }, request, response }: HttpContextContract) {
    const productDiscount = await ProductDiscount.find(id)
    if (!productDiscount) {
      throw new ModelNotFoundException(`Invalid id ${id} deleting product discount`)
    }

    await productDiscount.delete()

    const successMsg = `Successfully deleted product discount by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
    } as BasicResponse)
  }
}
