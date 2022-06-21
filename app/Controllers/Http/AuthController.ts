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

      const message = 'Successfully logged in'
      LogRouteSuccess('POST /api/login', message)
      return response.created({
        code: 201,
        message: message,
        token: tokenData.token,
        user: user,
      } as AuthResponse)
    } catch (error) {
      throw new ModelNotFoundException(`Invalid password ${validatedData.password} logging in user`)
    }
  }

  public async logout({ response, auth }: HttpContextContract) {
    await auth.use('api').revoke()

    const message = 'Successfully logged out'
    LogRouteSuccess('POST /api/logout', message)
    return response.ok({
      code: 200,
      message: message,
    } as BasicResponse)
  }
}
