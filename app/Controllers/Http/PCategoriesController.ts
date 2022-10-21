import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import ProductCategory from 'App/Models/ProductCategory'
import { PCategoriesResponse, PCategoryResponse, BasicResponse } from 'App/Controllers/Http/types'
import PaginationValidator from 'App/Validators/List/PaginationValidator'
import SortValidator from 'App/Validators/List/SortValidator'
import CreatePCategoryValidator from 'App/Validators/Product/CreatePCategoryValidator'
import UpdatePCategoryValidator from 'App/Validators/Product/UpdatePCategoryValidator'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'
import { logRouteSuccess } from 'App/Utils/logger'

export default class PCategoriesController {
  public async index({ request, response }: HttpContextContract) {
    const validatedPaginationData = await request.validate(PaginationValidator)
    const page = validatedPaginationData.page || 1
    const limit = validatedPaginationData.limit || 10

    const validatedSortData = await request.validate(SortValidator)
    const sortBy = validatedSortData.sortBy || 'id'
    const order = validatedSortData.order || 'asc'

    const productCategories = await ProductCategory.query()
      .orderBy(sortBy, order)
      .paginate(page, limit)
    const result = productCategories.toJSON()

    const successMsg = 'Successfully got product categories'
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      productCategories: result.data,
      totalPages: Math.ceil(result.meta.total / limit),
      currentPage: result.meta.current_page as number,
    } as PCategoriesResponse)
  }

  /*public async show({ params: { id }, request, response }: HttpContextContract) {
    const productCategory = await ProductCategory.find(id)
    if (!productCategory) {
      throw new ModelNotFoundException(`Invalid id ${id} getting product category`)
    }

    const successMsg = `Successfully got product category by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      productCategory: productCategory,
    } as PCategoryResponse)
  }*/

  public async store({ request, response }: HttpContextContract) {
    const validatedData = await request.validate(CreatePCategoryValidator)

    const productCategory = await ProductCategory.create(validatedData)

    const successMsg = 'Successfully created product category'
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      productCategory: productCategory,
    } as PCategoryResponse)
  }

  public async update({ params: { id }, request, response }: HttpContextContract) {
    const productCategory = await ProductCategory.find(id)
    if (!productCategory) {
      throw new ModelNotFoundException(`Invalid id ${id} updating product category`)
    }

    const validatedData = await request.validate(UpdatePCategoryValidator)

    productCategory.merge(validatedData)
    await productCategory.save()

    const successMsg = `Successfully updated product category by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      productCategory: productCategory,
    } as PCategoryResponse)
  }

  public async destroy({ params: { id }, request, response }: HttpContextContract) {
    const productCategory = await ProductCategory.find(id)
    if (!productCategory) {
      throw new ModelNotFoundException(`Invalid id ${id} deleting product category`)
    }

    await productCategory.delete()

    const successMsg = `Successfully deleted product category by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
    } as BasicResponse)
  }
}
