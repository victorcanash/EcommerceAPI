import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'

import User from 'App/Models/User'
import { BasicResponse, AuthResponse } from 'App/Controllers/Http/types'
import LoginValidator from 'App/Validators/User/LoginValidator'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'
import PermissionException from 'App/Exceptions/PermissionException'
import { logRouteSuccess } from 'App/Utils/logger'

export default class AuthController {
  public async login({ request, response, auth }: HttpContextContract): Promise<void> {
    const validatedData = await request.validate(LoginValidator)

    const user = await User.findBy('email', validatedData.email)
    if (!user) {
      throw new ModelNotFoundException(`Invalid email ${validatedData.email} logging in user`)
    }

    try {
      const tokenData = await auth.attempt(validatedData.email, validatedData.password, {
        expiresIn: Env.get('TOKEN_EXPIRY', '7days'),
      })

      if (user.lockedOut) {
        throw new PermissionException('You are locked out')
      }

      await user.load('addresses')
      await user.load('payments')
      await user.load('cart')
      if (user.cart) {
        await user.cart.load('items')
      }

      const successMsg = `Successfully logged in user with email ${user.email}`
      logRouteSuccess(request, successMsg)
      return response.created({
        code: 201,
        message: successMsg,
        token: tokenData.token,
        user: user,
      } as AuthResponse)
    } catch (error) {
      throw new ModelNotFoundException(`Invalid password ${validatedData.password} logging in user`)
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
}
