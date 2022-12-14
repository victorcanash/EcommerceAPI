import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { defaultPage, defaultLimit, defaultOrder, defaultSortBy } from 'App/constants/lists'
import Product from 'App/Models/Product'
import ProductCategory from 'App/Models/ProductCategory'
import ProductsService from 'App/Services/ProductsService'
import UsersService from 'App/Services/UsersService'
import { ProductsResponse, ProductResponse, BasicResponse } from 'App/Controllers/Http/types'
import PaginationValidator from 'App/Validators/List/PaginationValidator'
import SortValidator from 'App/Validators/List/SortValidator'
import FilterProductValidator from 'App/Validators/Product/FilterProductValidator'
import CreateProductValidator from 'App/Validators/Product/CreateProductValidator'
import UpdateProductValidator from 'App/Validators/Product/UpdateProductValidator'
import PermissionException from 'App/Exceptions/PermissionException'
import { logRouteSuccess } from 'App/Utils/logger'

export default class ProductsController {
  public async index({ request, response, auth }: HttpContextContract) {
    const validatedPaginationData = await request.validate(PaginationValidator)
    const page = validatedPaginationData.page || defaultPage
    const limit = validatedPaginationData.limit || defaultLimit

    const validatedSortData = await request.validate(SortValidator)
    const sortBy = validatedSortData.sortBy || defaultSortBy
    const order = validatedSortData.order || defaultOrder

    const validatedFilterData = await request.validate(FilterProductValidator)
    const keywords = validatedFilterData.keywords || ''
    const categoryName = validatedFilterData.categoryName || null
    const adminData = validatedFilterData.adminData || false

    if (adminData && !UsersService.isAuthAdmin(auth)) {
      throw new PermissionException('You need to be an admin to get admin data')
    }

    const products = await Product.query()
      .apply((scopes) => {
        scopes.filter(keywords, categoryName)
        scopes.getAllData()
        if (adminData) {
          scopes.getAdminData()
        }
      })
      .orderBy(sortBy, order)
      .paginate(page, limit)
    const result = products.toJSON()

    let category: ProductCategory | null = null
    if (categoryName) {
      category = await ProductsService.getCategoryByName(categoryName)
    }

    const successMsg = 'Successfully got products'
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      products: result.data,
      category: category,
      totalPages: Math.ceil(result.meta.total / limit),
      currentPage: result.meta.current_page as number,
    } as ProductsResponse)
  }

  public async show({ params: { id }, request, response, auth }: HttpContextContract) {
    const validatedFilterData = await request.validate(FilterProductValidator)
    const adminData = validatedFilterData.adminData || false

    if (adminData && !UsersService.isAuthAdmin(auth)) {
      throw new PermissionException('You need to be an admin to get admin data')
    }

    const product = await ProductsService.getProductById(id, true, adminData, true)

    const successMsg = `Successfully got product by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      product: product,
    } as ProductResponse)
  }

  public async store({ request, response }: HttpContextContract) {
    const validatedData = await request.validate(CreateProductValidator)

    const product = await Product.create(validatedData)

    const successMsg = 'Successfully created product'
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      product: product,
    } as ProductResponse)
  }

  public async update({ params: { id }, request, response }: HttpContextContract) {
    const product = await ProductsService.getProductById(id, false)

    const validatedData = await request.validate(UpdateProductValidator)

    product.merge(validatedData)
    await product.save()

    const successMsg = `Successfully updated product by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      product: product,
    } as ProductResponse)
  }

  public async destroy({ params: { id }, request, response }: HttpContextContract) {
    const product = await ProductsService.getProductById(id, false)

    await product.delete()

    const successMsg = `Successfully deleted product by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
    } as BasicResponse)
  }
}
