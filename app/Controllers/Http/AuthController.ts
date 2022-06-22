import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'

import User from 'App/Models/User'
import { BasicResponse, AuthResponse } from 'App/Controllers/Http/types'
import LoginValidator from 'App/Validators/LoginValidator'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'
import PermissionException from 'App/Exceptions/PermissionException'
import { LogRouteSuccess } from 'App/Utils/Logger'

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
        throw new PermissionException('Locked out user')
      }

      const successMsg = `Successfully logged in user with email ${user.email}`
      LogRouteSuccess(request, successMsg)
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

    LogRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
    } as BasicResponse)
  }
}
