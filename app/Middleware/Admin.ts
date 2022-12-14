import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import PermissionException from 'App/Exceptions/PermissionException'
import { Roles } from 'App/Constants/auth'

export default class AdminMiddleware {
  public async handle({ auth }: HttpContextContract, next: () => Promise<void>) {
    if (auth.user?.role !== Roles.ADMIN) {
      throw new PermissionException('You need to be an admin')
    }

    await next()
  }
}
