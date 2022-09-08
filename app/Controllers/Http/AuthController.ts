import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'

import User from 'App/Models/User'
import {
  BasicResponse,
  AuthResponse,
  IsAdminResponse,
  UserResponse,
} from 'App/Controllers/Http/types'
import LoginValidator from 'App/Validators/User/LoginValidator'
import UpdateAuthValidator from 'App/Validators/User/UpdateAuthValidator'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'
import BadRequestException from 'App/Exceptions/BadRequestException'
import PermissionException from 'App/Exceptions/PermissionException'
import { logRouteSuccess } from 'App/Utils/logger'
import { Roles } from 'App/Models/Enums/Roles'

export default class AuthController {
  public async login({ request, response, auth }: HttpContextContract): Promise<void> {
    const validatedData = await request.validate(LoginValidator)

    const user = await this.getUserWithAll(validatedData.email)
    if (!user) {
      throw new ModelNotFoundException(`Invalid email logging in user`)
    }
    if (user.lockedOut) {
      throw new PermissionException('You are locked out')
    }

    try {
      const tokenData = await auth.attempt(validatedData.email, validatedData.password, {
        expiresIn: Env.get('TOKEN_EXPIRY', '7days'),
      })

      const successMsg = `Successfully logged in user with email ${user.email}`
      logRouteSuccess(request, successMsg)
      return response.created({
        code: 201,
        message: successMsg,
        token: tokenData.token,
        user: user,
      } as AuthResponse)
    } catch (error) {
      throw new ModelNotFoundException(`Invalid password logging in user`)
    }
  }

  public async logout({ request, response, auth }: HttpContextContract) {
    const successMsg = `Successfully logged out user with email ${auth.user?.email}`

    await auth.use('api').revoke()

    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
    } as BasicResponse)
  }

  public async logged({ request, response, auth }: HttpContextContract) {
    const user = await this.getUserWithAll(auth.user?.email)
    if (!user) {
      throw new ModelNotFoundException(`Invalid auth email ${auth.user?.email} getting logged user`)
    }

    const successMsg = `Successfully got logged user`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      user: user,
    } as UserResponse)
  }

  public async isAdmin({ request, response, auth }: HttpContextContract) {
    const user = await User.query().where('email', auth.user?.email).first()

    let isAdmin = user && user.role === Roles.ADMIN ? true : false
    const successMsg = 'Successfully checked if user is admin'
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      isAdmin: isAdmin,
    } as IsAdminResponse)
  }

  public async update({ params: { id }, request, response, auth, bouncer }: HttpContextContract) {
    const user = await User.find(id)
    if (!user) {
      throw new ModelNotFoundException(`Invalid id ${id} updating user email and/or password`)
    }

    await bouncer.with('UserPolicy').authorize('update', user)

    const validatedData = await request.validate(UpdateAuthValidator)

    if (validatedData.email && user.email !== validatedData.email) {
      const userWithEmail = await User.query().where('email', validatedData.email).first()
      if (userWithEmail) {
        throw new BadRequestException('Email must be unique to update user email and password')
      }
    }

    await auth.use('api').revoke()

    user.merge(validatedData)
    await user.save()

    const tokenData = await auth.use('api').generate(user, {
      expiresIn: Env.get('TOKEN_EXPIRY', '7days'),
    })

    const successMsg = `Successfully updated user email and/or password by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      token: tokenData.token,
      user: user,
    } as AuthResponse)
  }

  private async getUserWithAll(email: string) {
    const user = await User.query()
      .where('email', email)
      .preload('addresses')
      .preload('payments')
      .preload('cart', (query) => {
        query.preload('items', (query) => {
          query.preload('product')
          query.preload('inventory')
        })
      })
      .first()

    return user
  }
}
