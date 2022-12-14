import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { defaultPage, defaultLimit, defaultOrder, defaultSortBy } from 'App/constants/lists'
import { AddressTypes } from 'App/constants/addresses'
import User from 'App/Models/User'
import UserAddress from 'App/Models/UserAddress'
import Cart from 'App/Models/Cart'
import UsersService from 'App/Services/UsersService'
import {
  UsersResponse,
  UserResponse,
  UAddressesResponse,
  BasicResponse,
} from 'App/Controllers/Http/types'
import PaginationValidator from 'App/Validators/List/PaginationValidator'
import SortValidator from 'App/Validators/List/SortValidator'
import CreateUserValidator from 'App/Validators/User/CreateUserValidator'
import UpdateUserValidator from 'App/Validators/User/UpdateUserValidator'
import UpdateUAddressesValidator from 'App/Validators/User/UpdateUAddressesValidator'
import { logRouteSuccess } from 'App/Utils/logger'

export default class UsersController {
  public async index({ request, response }: HttpContextContract) {
    const validatedPaginationData = await request.validate(PaginationValidator)
    const page = validatedPaginationData.page || defaultPage
    const limit = validatedPaginationData.limit || defaultLimit

    const validatedSortData = await request.validate(SortValidator)
    const sortBy = validatedSortData.sortBy || defaultSortBy
    const order = validatedSortData.order || defaultOrder

    const users = await User.query()
      .apply((scopes) => {
        scopes.getAllData()
      })
      .orderBy(sortBy, order)
      .paginate(page, limit)
    const result = users.toJSON()

    const successMsg = 'Successfully got users'
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      users: result.data,
      totalPages: Math.ceil(result.meta.total / limit),
      currentPage: result.meta.current_page as number,
    } as UsersResponse)
  }

  public async show({ params: { id }, request, response, bouncer }: HttpContextContract) {
    const user = await UsersService.getUserById(id, true)

    await bouncer.with('UserPolicy').authorize('view', user)

    const successMsg = `Successfully got user by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      user: user,
    } as UserResponse)
  }

  public async store({ request, response }: HttpContextContract) {
    const validatedData = await request.validate(CreateUserValidator)

    const user = await User.create(validatedData)
    await Cart.create({ userId: user.id })

    const successMsg = 'Successfully created user'
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      user: user,
    } as UserResponse)
  }

  public async update({ params: { id }, request, response, bouncer }: HttpContextContract) {
    const user = await UsersService.getUserById(id, true)

    await bouncer.with('UserPolicy').authorize('update', user)

    const validatedData = await request.validate(UpdateUserValidator)

    user.merge(validatedData)
    await user.save()

    const successMsg = `Successfully updated user by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      user: user,
    } as UserResponse)
  }

  public async updateAddresses({
    params: { id },
    request,
    response,
    bouncer,
  }: HttpContextContract) {
    const user = await UsersService.getUserById(id, false)

    await bouncer.with('UserPolicy').authorize('update', user)

    const validatedData = await request.validate(UpdateUAddressesValidator)

    await user.load('shipping')
    await user.load('billing')
    let shipping: UserAddress
    if (user.shipping) {
      user.shipping.merge(validatedData.shipping)
      shipping = await user.shipping.save()
    } else {
      shipping = await UserAddress.create({
        ...validatedData.shipping,
        userId: user.id,
        type: AddressTypes.SHIPPING,
      })
    }
    let billing: UserAddress
    if (user.billing) {
      user.billing.merge(validatedData.billing)
      billing = await user.billing.save()
    } else {
      billing = await UserAddress.create({
        ...validatedData.billing,
        userId: user.id,
        type: AddressTypes.BILLING,
      })
    }

    const successMsg = `Successfully updated user addresses by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      shipping: shipping,
      billing: billing,
    } as UAddressesResponse)
  }

  public async destroy({ params: { id }, request, response, bouncer }: HttpContextContract) {
    const user = await UsersService.getUserById(id, false)

    await bouncer.with('UserPolicy').authorize('delete', user)

    await user.delete()

    const successMsg = `Successfully deleted user by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
    } as BasicResponse)
  }
}
