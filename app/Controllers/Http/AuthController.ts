import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'

import User from 'App/Models/User'

export default class AuthController {
  public async login({ request, response, auth }: HttpContextContract) {
    const { email, password } = request.all()

    const user = await User.findBy('email', email)

    if (!user) {
      return response.badRequest('Wrong email')
    }

    try {
      const token = await auth.attempt(email, password, {
        expiresIn: Env.get('TOKEN_EXPIRY', '7days'),
      })

      if (user.lockedOut) {
        return response.forbidden('Locked out user')
      }

      return response.created({ token: token, user: auth.user })
    } catch (error) {
      return response.badRequest('Wrong password')
    }
  }

  public async logout({ response, auth }: HttpContextContract) {
    await auth.use('api').revoke()
    return response.ok('Logged out')
  }
}
