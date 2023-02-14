import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { defaultPage, defaultLimit, defaultOrder, defaultSortBy } from 'App/Constants/lists'
import ProductInventory from 'App/Models/ProductInventory'
import ProductsService from 'App/Services/ProductsService'
import { PInventoryResponse, PInventoriesResponse, BasicResponse } from 'App/Controllers/Http/types'
import PaginationValidator from 'App/Validators/List/PaginationValidator'
import SortValidator from 'App/Validators/List/SortValidator'
import FilterPInventoryValidator from 'App/Validators/Product/FilterPInventoryValidator'
import CreatePInventoryValidator from 'App/Validators/Product/CreatePInventoryValidator'
import UpdatePInventoryValidator from 'App/Validators/Product/UpdatePInventoryValidator'
import { logRouteSuccess } from 'App/Utils/logger'

export default class PInventoriesController {
  public async index({ request, response }: HttpContextContract) {
    const validatedPaginationData = await request.validate(PaginationValidator)
    const page = validatedPaginationData.page || defaultPage
    const limit = validatedPaginationData.limit || defaultLimit

    const validatedSortData = await request.validate(SortValidator)
    const sortBy = validatedSortData.sortBy || defaultSortBy
    const order = validatedSortData.order || defaultOrder

    const validatedFilterData = await request.validate(FilterPInventoryValidator)
    const ids = validatedFilterData.ids || []

    const inventories = await ProductInventory.query()
      .where((query) => {
        if (ids.length > 0) {
          query.whereIn('id', ids)
        }
      })
      .orderBy(sortBy, order)
      .paginate(page, limit)
    const result = inventories.toJSON()

    const successMsg = 'Successfully got product inventories'
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      productInventories: result.data,
      totalPages: Math.ceil(result.meta.total / limit),
      currentPage: result.meta.current_page as number,
    } as PInventoriesResponse)
  }

  public async store({ request, response }: HttpContextContract) {
    const validatedData = await request.validate(CreatePInventoryValidator)

    const textsData = await ProductsService.createLocalizedTexts(
      validatedData.name,
      validatedData.description
    )
    const productInventory = await ProductInventory.create({
      ...validatedData,
      ...textsData,
    })

    const successMsg = 'Successfully created product inventory'
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      productInventory: productInventory,
    } as PInventoryResponse)
  }

  public async update({ params: { id }, request, response }: HttpContextContract) {
    const productInventory = await ProductsService.getInventoryById(id)

    const validatedData = await request.validate(UpdatePInventoryValidator)

    await ProductsService.updateLocalizedTexts(
      productInventory,
      validatedData.name,
      validatedData.description
    )
    productInventory.merge(validatedData)
    await productInventory.save()

    const successMsg = `Successfully updated product inventory by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      productInventory: productInventory,
    } as PInventoryResponse)
  }

  public async destroy({ params: { id }, request, response }: HttpContextContract) {
    const productInventory = await ProductsService.getInventoryById(id)

    await productInventory.delete()

    const successMsg = `Successfully deleted product inventory by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
    } as BasicResponse)
  }
}
