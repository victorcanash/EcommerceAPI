import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import ProductDiscount from 'App/Models/ProductDiscount'
import ProductsService from 'App/Services/ProductsService'
import { PDiscountResponse, BasicResponse } from 'App/Controllers/Http/types'
import CreatePDiscountValidator from 'App/Validators/Product/CreatePDiscountValidator'
import UpdatePDiscountValidator from 'App/Validators/Product/UpdatePDiscountValidator'
import { logRouteSuccess } from 'App/Utils/logger'

export default class PDiscountsController {
  public async store({ request, response }: HttpContextContract) {
    const validatedData = await request.validate(CreatePDiscountValidator)

    const textsData = await ProductsService.createLocalizedTexts(
      validatedData.name,
      validatedData.description
    )
    const productDiscount = await ProductDiscount.create({
      ...validatedData,
      ...textsData,
    })

    const successMsg = 'Successfully created product discount'
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      productDiscount: productDiscount,
    } as PDiscountResponse)
  }

  public async update({ params: { id }, request, response }: HttpContextContract) {
    const productDiscount = await ProductsService.getDiscountById(id)

    const validatedData = await request.validate(UpdatePDiscountValidator)

    await ProductsService.updateLocalizedTexts(
      productDiscount,
      validatedData.name,
      validatedData.description
    )
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
    const productDiscount = await ProductsService.getDiscountById(id)

    await productDiscount.delete()

    const successMsg = `Successfully deleted product discount by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
    } as BasicResponse)
  }
}
