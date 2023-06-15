import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { defaultPage, defaultLimit, defaultOrder, defaultSortBy } from 'App/Constants/lists'
import Landing from 'App/Models/Landing'
import ProductsService from 'App/Services/ProductsService'
import { LandingResponse, LandingsResponse } from 'App/Controllers/Http/types'
import PaginationValidator from 'App/Validators/List/PaginationValidator'
import SortValidator from 'App/Validators/List/SortValidator'
import FilterLandingValidator from 'App/Validators/Product/FilterLandingValidator'
import CreateLandingValidator from 'App/Validators/Product/CreateLandingValidator'
import { logRouteSuccess } from 'App/Utils/logger'

export default class LandingsController {
  public async index({ request, response }: HttpContextContract) {
    const validatedPaginationData = await request.validate(PaginationValidator)
    const page = validatedPaginationData.page || defaultPage
    const limit = validatedPaginationData.limit || defaultLimit

    const validatedSortData = await request.validate(SortValidator)
    const sortBy = validatedSortData.sortBy || defaultSortBy
    const order = validatedSortData.order || defaultOrder

    const validatedFilterData = await request.validate(FilterLandingValidator)
    const productsData = validatedFilterData.productsData || false

    const landings = await Landing.query()
      .apply((scopes) => {
        if (productsData) {
          scopes.getProductsData()
        }
      })
      .orderBy(sortBy, order)
      .paginate(page, limit)
    const result = landings.toJSON()

    const successMsg = 'Successfully got landings'
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      landings: result.data,
      totalPages: Math.ceil(result.meta.total / limit),
      currentPage: result.meta.current_page as number,
    } as LandingsResponse)
  }

  public async show({ params: { id }, request, response }: HttpContextContract) {
    const landing = await Landing.query()
      .where('slug', id)
      .apply((scopes) => {
        scopes.getProductsData()
      })
      .first()

    const successMsg = `Successfully got landing by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      landing: landing,
    } as LandingResponse)
  }

  public async store({ request, response }: HttpContextContract) {
    const validatedData = await request.validate(CreateLandingValidator)

    const textsData = await ProductsService.createLocalizedTexts(
      validatedData.name,
      validatedData.description
    )
    const landing = await Landing.create({
      ...validatedData,
      ...textsData,
    })

    const successMsg = 'Successfully created landing'
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      landing: landing,
    } as LandingResponse)
  }
}
