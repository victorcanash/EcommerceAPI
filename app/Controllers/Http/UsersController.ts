import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import User from 'App/Models/User'
import { UsersResponse, UserResponse, BasicResponse } from 'App/Controllers/Http/types'
import SortValidator from 'App/Validators/SortValidator'
import CreateUserValidator from 'App/Validators/CreateUserValidator'
import UpdateUserValidator from 'App/Validators/UpdateUserValidator'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'
import { LogRouteSuccess } from 'App/Utils/Logger'

export default class UsersController {
  public async index({ request, response }: HttpContextContract) {
    const page = request.input('page', 1) ?? 1
    const limit = request.input('limit', 10) ?? 10

    const validatedData = await request.validate(SortValidator)
    const sortBy = validatedData.sort_by || 'id'
    const order = validatedData.order || 'asc'

    const users = await User.query().orderBy(sortBy, order).paginate(page, limit)
    const result = users.toJSON()

    const message = 'Successfully got users'
    LogRouteSuccess('GET /api/users', message)
    return response.ok({
      code: 200,
      message: message,
      users: result.data,
      totalPages: Math.ceil(result.meta.total / limit),
      currentPage: result.meta.current_page as number,
    } as UsersResponse)
  }

  public async show({ params: { id }, response }: HttpContextContract) {
    const user = await User.find(id)
    if (!user) {
      throw new ModelNotFoundException(`Invalid id ${id} getting user`)
    }

    const message = 'Successfully got user'
    LogRouteSuccess('GET /api/users/:id', message)
    return response.ok({
      code: 200,
      message: message,
      user: user,
    } as UserResponse)
  }

  public async store({ request, response }: HttpContextContract) {
    const validatedData = await request.validate(CreateUserValidator)

    const user = await User.create(validatedData)

    const message = 'Successfully created user'
    LogRouteSuccess('POST /api/register', message)
    return response.created({
      code: 201,
      message: message,
      user: user,
    } as UserResponse)
  }

  public async update({ params: { id }, request, response }: HttpContextContract) {
    const user = await User.find(id)
    if (!user) {
      throw new ModelNotFoundException(`Invalid id ${id} updating user`)
    }

    const validatedData = await request.validate(UpdateUserValidator)

    user.merge(validatedData)
    await user.save()

    const message = 'Successfully updated user'
    LogRouteSuccess('PUT /api/users/:id', message)
    return response.created({
      code: 201,
      message: message,
      user: user,
    } as UserResponse)
  }

  public async destroy({ params: { id }, response }: HttpContextContract) {
    const user = await User.find(id)
    if (!user) {
      throw new ModelNotFoundException(`Invalid id ${id} destroying user`)
    }

    await user.delete()

    const message = 'Successfully deleted user'
    LogRouteSuccess('DELETE /api/users/:id', message)
    return response.ok({
      code: 200,
      message: message,
    } as BasicResponse)
  }
}
