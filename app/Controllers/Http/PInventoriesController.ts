import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import ProductInventory from 'App/Models/ProductInventory'
import { PInventoriesResponse, PInventoryResponse, BasicResponse } from 'App/Controllers/Http/types'
import PaginationValidator from 'App/Validators/List/PaginationValidator'
import SortValidator from 'App/Validators/List/SortValidator'
import CreatePInventoryValidator from 'App/Validators/Product/CreatePInventoryValidator'
import UpdatePInventoryValidator from 'App/Validators/Product/UpdatePInventoryValidator'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'
import { logRouteSuccess } from 'App/Utils/logger'

export default class PInventoriesController {
  public async index({ request, response }: HttpContextContract) {
    const validatedPaginationData = await request.validate(PaginationValidator)
    const page = validatedPaginationData.page || 1
    const limit = validatedPaginationData.limit || 10

    const validatedSortData = await request.validate(SortValidator)
    const sortBy = validatedSortData.sort_by || 'id'
    const order = validatedSortData.order || 'asc'

    const productInventories = await ProductInventory.query()
      .orderBy(sortBy, order)
      .paginate(page, limit)
    const result = productInventories.toJSON()

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

  public async show({ params: { id }, request, response }: HttpContextContract) {
    const productInventory = await ProductInventory.find(id)
    if (!productInventory) {
      throw new ModelNotFoundException(`Invalid id ${id} getting product inventory`)
    }

    const successMsg = `Successfully got product inventory by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      productInventory: productInventory,
    } as PInventoryResponse)
  }

  public async store({ request, response }: HttpContextContract) {
    const validatedData = await request.validate(CreatePInventoryValidator)

    const productInventory = await ProductInventory.create(validatedData)

    const successMsg = 'Successfully created product inventory'
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      productInventory: productInventory,
    } as PInventoryResponse)
  }

  public async update({ params: { id }, request, response }: HttpContextContract) {
    const productInventory = await ProductInventory.find(id)
    if (!productInventory) {
      throw new ModelNotFoundException(`Invalid id ${id} updating product inventory`)
    }

    const validatedData = await request.validate(UpdatePInventoryValidator)

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
    const productInventory = await ProductInventory.find(id)
    if (!productInventory) {
      throw new ModelNotFoundException(`Invalid id ${id} deleting product inventory`)
    }

    await productInventory.delete()

    const successMsg = `Successfully deleted product inventory by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
    } as BasicResponse)
  }
}
