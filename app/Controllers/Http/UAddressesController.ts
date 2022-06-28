import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import UserAddress from 'App/Models/UserAddress'
import { UAddressesResponse, UAddressResponse, BasicResponse } from 'App/Controllers/Http/types'
import PaginationValidator from 'App/Validators/List/PaginationValidator'
import SortValidator from 'App/Validators/List/SortValidator'
import CreateUAddressValidator from 'App/Validators/User/CreateUAddressValidator'
import UpdateUAddressValidator from 'App/Validators/User/UpdateUAddressValidator'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'
import { logRouteSuccess } from 'App/utils/logger'

export default class UAddressesController {
  public async index({ request, response }: HttpContextContract) {
    const validatedPaginationData = await request.validate(PaginationValidator)
    const page = validatedPaginationData.page || 1
    const limit = validatedPaginationData.limit || 10

    const validatedSortData = await request.validate(SortValidator)
    const sortBy = validatedSortData.sort_by || 'id'
    const order = validatedSortData.order || 'asc'

    const userAddresses = await UserAddress.query().orderBy(sortBy, order).paginate(page, limit)
    const result = userAddresses.toJSON()

    const successMsg = 'Successfully got user addresses'
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      userAddresses: result.data,
      totalPages: Math.ceil(result.meta.total / limit),
      currentPage: result.meta.current_page as number,
    } as UAddressesResponse)
  }

  public async show({ params: { id }, request, response, bouncer }: HttpContextContract) {
    const userAddress = await UserAddress.find(id)
    if (!userAddress) {
      throw new ModelNotFoundException(`Invalid id ${id} getting user address`)
    }

    await bouncer.with('UAddressPolicy').authorize('view', userAddress)

    const successMsg = `Successfully got user address by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      userAddress: userAddress,
    } as UAddressResponse)
  }

  public async store({ request, response, auth }: HttpContextContract) {
    const validatedData = await request.validate(CreateUAddressValidator)
    validatedData.userId = auth.user?.id

    const userAddress = await UserAddress.create(validatedData)

    const successMsg = 'Successfully created user address'
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      userAddress: userAddress,
    } as UAddressResponse)
  }

  public async update({ params: { id }, request, response, bouncer }: HttpContextContract) {
    const userAddress = await UserAddress.find(id)
    if (!userAddress) {
      throw new ModelNotFoundException(`Invalid id ${id} updating user address`)
    }

    await bouncer.with('UAddressPolicy').authorize('update', userAddress)

    const validatedData = await request.validate(UpdateUAddressValidator)

    userAddress.merge(validatedData)
    await userAddress.save()

    const successMsg = `Successfully updated user address by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      userAddress: userAddress,
    } as UAddressResponse)
  }

  public async destroy({ params: { id }, request, response, bouncer }: HttpContextContract) {
    const userAddress = await UserAddress.find(id)
    if (!userAddress) {
      throw new ModelNotFoundException(`Invalid id ${id} deleting user address`)
    }

    await bouncer.with('UAddressPolicy').authorize('delete', userAddress)

    await userAddress.delete()

    const successMsg = `Successfully deleted user address by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
    } as BasicResponse)
  }
}
