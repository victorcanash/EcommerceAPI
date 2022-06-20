import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import User from 'App/Models/User'
import { UsersResponse, UserResponse, BasicResponse } from 'App/Controllers/Http/types'
import CreateUserValidator from 'App/Validators/CreateUserValidator'
import SortValidator from 'App/Validators/SortValidator'
import UpdateUserValidator from 'App/Validators/UpdateUserValidator'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'

export default class UsersController {
  public async index({ request, response }: HttpContextContract) {
    const page = request.input('page', 1) ?? 1
    const limit = request.input('limit', 10) ?? 10

    const validatedData = await request.validate(SortValidator)
    const sortBy = validatedData.sort_by || 'id'
    const order = validatedData.order || 'asc'

    const users = await User.query().orderBy(sortBy, order).paginate(page, limit)
    const result = users.toJSON()

    return response.ok({
      code: 200,
      message: 'Successfully got users',
      users: result.data,
      totalPages: Math.ceil(result.meta.total / limit),
      currentPage: result.meta.current_page as number,
    } as UsersResponse)
  }

  public async show({ params: { id }, response }: HttpContextContract) {
    const user = await User.find(id)
    if (!user) {
      throw new ModelNotFoundException('Invalid id')
    }

    return response.ok({
      code: 200,
      message: 'Successfully got user',
      user: user,
    } as UserResponse)
  }

  public async store({ request, response }: HttpContextContract) {
    const validatedData = await request.validate(CreateUserValidator)

    const user = await User.create(validatedData)

    return response.created({
      code: 201,
      message: 'Successfully created user',
      user: user,
    } as UserResponse)
  }

  public async update({ params: { id }, request, response }: HttpContextContract) {
    const user = await User.find(id)
    if (!user) {
      throw new ModelNotFoundException('Invalid id')
    }

    const validatedData = await request.validate(UpdateUserValidator)

    user.merge(validatedData)
    await user.save()

    return response.created({
      code: 201,
      message: 'Successfully updated user',
      user: user,
    } as UserResponse)
  }

  public async destroy({ params: { id }, response }: HttpContextContract) {
    const user = await User.find(id)
    if (!user) {
      throw new ModelNotFoundException('Invalid id')
    }

    await user.delete()

    return response.ok({
      code: 200,
      message: 'Successfully deleted user',
    } as BasicResponse)
  }
}
