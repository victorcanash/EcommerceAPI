import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import ProductInventory from 'App/Models/ProductInventory'
import ProductsService from 'App/Services/ProductsService'
import { PInventoryResponse, BasicResponse } from 'App/Controllers/Http/types'
import CreatePInventoryValidator from 'App/Validators/Product/CreatePInventoryValidator'
import UpdatePInventoryValidator from 'App/Validators/Product/UpdatePInventoryValidator'
import { logRouteSuccess } from 'App/Utils/logger'

export default class PInventoriesController {
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
    const productInventory = await ProductsService.getInventoryById(id)

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
