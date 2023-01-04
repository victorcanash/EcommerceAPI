import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { defaultPage, defaultLimit, defaultOrder, defaultSortBy } from 'App/Constants/lists'
import ProductCategory from 'App/Models/ProductCategory'
import ProductsService from 'App/Services/ProductsService'
import { PCategoriesResponse, PCategoryResponse, BasicResponse } from 'App/Controllers/Http/types'
import PaginationValidator from 'App/Validators/List/PaginationValidator'
import SortValidator from 'App/Validators/List/SortValidator'
import CreatePCategoryValidator from 'App/Validators/Product/CreatePCategoryValidator'
import UpdatePCategoryValidator from 'App/Validators/Product/UpdatePCategoryValidator'
import { logRouteSuccess } from 'App/Utils/logger'

export default class PCategoriesController {
  public async index({ request, response }: HttpContextContract) {
    const validatedPaginationData = await request.validate(PaginationValidator)
    const page = validatedPaginationData.page || defaultPage
    const limit = validatedPaginationData.limit || defaultLimit

    const validatedSortData = await request.validate(SortValidator)
    const sortBy = validatedSortData.sortBy || defaultSortBy
    const order = validatedSortData.order || defaultOrder

    const categories = await ProductCategory.query().orderBy(sortBy, order).paginate(page, limit)
    const result = categories.toJSON()

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

  public async show({ params: { id }, request, response }: HttpContextContract) {
    const productCategory = await ProductsService.getCategoryById(id)

    const successMsg = `Successfully got product category by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      productCategory: productCategory,
    } as PCategoryResponse)
  }

  public async store({ request, response }: HttpContextContract) {
    const validatedData = await request.validate(CreatePCategoryValidator)

    const textsData = await ProductsService.createLocalizedTexts(
      validatedData.name,
      validatedData.description
    )
    const productCategory = await ProductCategory.create(textsData)

    const successMsg = 'Successfully created product category'
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      productCategory: productCategory,
    } as PCategoryResponse)
  }

  public async update({ params: { id }, request, response }: HttpContextContract) {
    const productCategory = await ProductsService.getCategoryById(id)

    const validatedData = await request.validate(UpdatePCategoryValidator)

    await ProductsService.updateLocalizedTexts(
      productCategory,
      validatedData.name,
      validatedData.description
    )

    const successMsg = `Successfully updated product category by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      productCategory: productCategory,
    } as PCategoryResponse)
  }

  public async destroy({ params: { id }, request, response }: HttpContextContract) {
    const productCategory = await ProductsService.getCategoryById(id)

    await productCategory.delete()

    const successMsg = `Successfully deleted product category by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
    } as BasicResponse)
  }
}
