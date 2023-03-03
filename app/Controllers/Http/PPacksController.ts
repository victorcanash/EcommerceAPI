import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { defaultPage, defaultLimit, defaultOrder, defaultSortBy } from 'App/Constants/lists'
import ProductPack from 'App/Models/ProductPack'
import ProductsService from 'App/Services/ProductsService'
import { BasicResponse, PPackResponse, PPacksResponse } from 'App/Controllers/Http/types'
import PaginationValidator from 'App/Validators/List/PaginationValidator'
import SortValidator from 'App/Validators/List/SortValidator'
import CreatePPackValidator from 'App/Validators/Product/CreatePPackValidator'
import UpdatePPackValidator from 'App/Validators/Product/UpdatePPackValidator'
import { logRouteSuccess } from 'App/Utils/logger'

export default class PPacksController {
  public async index({ request, response }: HttpContextContract) {
    const validatedPaginationData = await request.validate(PaginationValidator)
    const page = validatedPaginationData.page || defaultPage
    const limit = validatedPaginationData.limit || defaultLimit

    const validatedSortData = await request.validate(SortValidator)
    const sortBy = validatedSortData.sortBy || defaultSortBy
    const order = validatedSortData.order || defaultOrder

    const packs = await ProductPack.query().orderBy(sortBy, order).paginate(page, limit)
    const result = packs.toJSON()

    const successMsg = 'Successfully got products'
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      productPacks: result.data,
      totalPages: Math.ceil(result.meta.total / limit),
      currentPage: result.meta.current_page as number,
    } as PPacksResponse)
  }

  public async store({ request, response }: HttpContextContract) {
    const validatedData = await request.validate(CreatePPackValidator)

    const textsData = await ProductsService.createLocalizedTexts(
      validatedData.name,
      validatedData.description
    )
    const productPack = await ProductPack.create({
      price: validatedData.price,
      ...textsData,
    })
    await productPack.related('inventories').attach(validatedData.inventoriesIds)
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
    productPack.merge({
      price: validatedData.price,
    })
    await productPack.related('inventories').detach()
    if (validatedData.inventoriesIds && validatedData.inventoriesIds?.length > 0) {
      await productPack.related('inventories').attach(validatedData.inventoriesIds)
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
