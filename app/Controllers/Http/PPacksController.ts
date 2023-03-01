import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import ProductPack from 'App/Models/ProductPack'
import ProductsService from 'App/Services/ProductsService'
import { PPackResponse, BasicResponse } from 'App/Controllers/Http/types'
import CreatePPackValidator from 'App/Validators/Product/CreatePPackValidator'
import UpdatePPackValidator from 'App/Validators/Product/UpdatePPackValidator'
import { logRouteSuccess } from 'App/Utils/logger'

export default class PPacksController {
  public async store({ request, response }: HttpContextContract) {
    const validatedData = await request.validate(CreatePPackValidator)

    const textsData = await ProductsService.createLocalizedTexts(
      validatedData.name,
      validatedData.description
    )
    const productPack = await ProductPack.create({
      ...validatedData,
      ...textsData,
    })
    await productPack.related('inventories').attach(validatedData.inventoryIds)
    await productPack.save()

    const successMsg = 'Successfully created product pack'
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      productPack: productPack,
    } as PPackResponse)
  }

  public async update({ params: { id }, request, response }: HttpContextContract) {
    const productPack = await ProductsService.getPackById(id)

    const validatedData = await request.validate(UpdatePPackValidator)

    await ProductsService.updateLocalizedTexts(
      productPack,
      validatedData.name,
      validatedData.description
    )
    productPack.merge(validatedData)
    await productPack.related('inventories').detach()
    if (validatedData.inventoryIds && validatedData.inventoryIds?.length > 0) {
      await productPack.related('inventories').attach(validatedData.inventoryIds)
    }
    await productPack.save()

    const successMsg = `Successfully updated product pack by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      productPack: productPack,
    } as PPackResponse)
  }

  public async destroy({ params: { id }, request, response }: HttpContextContract) {
    const productPack = await ProductsService.getPackById(id)

    await productPack.delete()

    const successMsg = `Successfully deleted product pack by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
    } as BasicResponse)
  }
}
