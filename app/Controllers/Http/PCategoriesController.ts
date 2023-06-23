import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import type { ModelPaginatorContract } from '@ioc:Adonis/Lucid/Orm'

import { defaultPage, defaultLimit, defaultOrder, defaultSortBy } from 'App/Constants/lists'
import ProductCategory from 'App/Models/ProductCategory'
import ProductCategoryGroup from 'App/Models/ProductCategoryGroup'
import ProductsService from 'App/Services/ProductsService'
import { BasicResponse, PCategoryResponse, PCategoriesResponse } from 'App/Controllers/Http/types'
import PaginationValidator from 'App/Validators/List/PaginationValidator'
import SortValidator from 'App/Validators/List/SortValidator'
import FilterPCategoryValidator from 'App/Validators/Product/FilterPCategoryValidator'
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

    const validatedFilterData = await request.validate(FilterPCategoryValidator)
    const categoryGroups = validatedFilterData.categoryGroups || false
    const adminData = validatedFilterData.adminData || false

    let categories: ModelPaginatorContract<ProductCategory | ProductCategoryGroup> | undefined
    if (categoryGroups) {
      categories = await ProductCategoryGroup.query()
        .where((query) => {
          if (adminData) {
            query.preload('categories')
          }
        })
        .orderBy(sortBy, order)
        .paginate(page, limit)
    } else {
      categories = await ProductCategory.query().orderBy(sortBy, order).paginate(page, limit)
    }
    const result = categories.toJSON()

    let categoriesWithoutGroup: ProductCategory[] | undefined
    if (adminData && categoryGroups) {
      categoriesWithoutGroup = await ProductCategory.query()
        .whereNull('categoryGroupId')
        .orderBy(defaultSortBy, defaultOrder)
    }

    const successMsg = 'Successfully got product categories'
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      productCategories: result.data,
      totalPages: Math.ceil(result.meta.total / limit),
      currentPage: result.meta.current_page as number,
      categoriesWithoutGroup: categoriesWithoutGroup,
    } as PCategoriesResponse)
  }

  public async show({ params: { id: slug }, request, response }: HttpContextContract) {
    const validatedPaginationData = await request.validate(PaginationValidator)
    const page = validatedPaginationData.page || defaultPage
    const limit = validatedPaginationData.limit || defaultLimit

    const validatedSortData = await request.validate(SortValidator)
    const sortBy = validatedSortData.sortBy || defaultSortBy
    const order = validatedSortData.order || defaultOrder

    const validatedFilterData = await request.validate(FilterPCategoryValidator)
    const adminData = validatedFilterData.adminData || false

    const category = await ProductsService.getCategoryBySlug(slug)

    const landingsResult = await ProductsService.getLandingsByCategory(
      category,
      page,
      limit,
      sortBy,
      order,
      adminData
    )

    const successMsg = `Successfully got product category by slug ${slug}`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      productCategory: category,
      landingsResult: {
        landings: landingsResult.data,
        totalPages: Math.ceil(landingsResult.meta.total / limit),
        currentPage: landingsResult.meta.current_page as number,
      },
    } as PCategoryResponse)
  }

  public async store({ request, response }: HttpContextContract) {
    const validatedData = await request.validate(CreatePCategoryValidator)
    const { isCategoryGroup, ...createCategoryData } = validatedData

    const textsData = await ProductsService.createLocalizedTexts(
      validatedData.name,
      validatedData.description
    )

    let productCategory: ProductCategory | ProductCategoryGroup | null
    if (!isCategoryGroup) {
      productCategory = await ProductCategory.create({
        ...createCategoryData,
        ...textsData,
      })
    } else {
      productCategory = await ProductCategoryGroup.create({
        ...createCategoryData,
        ...textsData,
      })
    }

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
