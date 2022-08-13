import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import User from 'App/Models/User'
import Cart from 'App/Models/Cart'
import { UsersResponse, UserResponse, BasicResponse } from 'App/Controllers/Http/types'
import PaginationValidator from 'App/Validators/List/PaginationValidator'
import SortValidator from 'App/Validators/List/SortValidator'
import CreateUserValidator from 'App/Validators/User/CreateUserValidator'
import UpdateUserValidator from 'App/Validators/User/UpdateUserValidator'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'
import { logRouteSuccess } from 'App/Utils/logger'

export default class UsersController {
  public async index({ request, response }: HttpContextContract) {
    const validatedPaginationData = await request.validate(PaginationValidator)
    const page = validatedPaginationData.page || 1
    const limit = validatedPaginationData.limit || 10

    const validatedSortData = await request.validate(SortValidator)
    const sortBy = validatedSortData.sort_by || 'id'
    const order = validatedSortData.order || 'asc'

    const users = await User.query().orderBy(sortBy, order).paginate(page, limit)
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
    const user = await User.find(id)
    if (!user) {
      throw new ModelNotFoundException(`Invalid id ${id} getting user`)
    }

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

    await Cart.create({ userId: user.id, total: 0 })

    const successMsg = 'Successfully created user'
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      user: user,
    } as UserResponse)
  }

  public async update({ params: { id }, request, response, bouncer }: HttpContextContract) {
    const user = await User.find(id)
    if (!user) {
      throw new ModelNotFoundException(`Invalid id ${id} updating user`)
    }

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

  public async destroy({ params: { id }, request, response, bouncer }: HttpContextContract) {
    const user = await User.find(id)
    if (!user) {
      throw new ModelNotFoundException(`Invalid id ${id} deleting user`)
    }

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
