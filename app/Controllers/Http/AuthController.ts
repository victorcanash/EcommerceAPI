import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'
import Hash from '@ioc:Adonis/Core/Hash'
import { DateTime } from 'luxon'

import User from 'App/Models/User'
import {
  BasicResponse,
  AuthResponse,
  IsAdminResponse,
  UserResponse,
} from 'App/Controllers/Http/types'
import LoginValidator from 'App/Validators/Auth/LoginValidator'
import UpdateAuthValidator from 'App/Validators/Auth/UpdateAuthValidator'
import SendActivationEmailValidator from 'App/Validators/Auth/SendActivationEmailValidator'
import SendResetEmailValidator from 'App/Validators/Auth/SendResetEmailValidator'
import SendUpdateEmailValidator from 'App/Validators/Auth/SendUpdateEmailValidator'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'
import BadRequestException from 'App/Exceptions/BadRequestException'
import PermissionException from 'App/Exceptions/PermissionException'
import ConflictException from 'App/Exceptions/ConflictException'
import { logRouteSuccess } from 'App/Utils/logger'
import { Roles } from 'App/Models/Enums/Roles'

export default class AuthController {
  public async activate({ response, request, auth }: HttpContextContract) {
    const user = await User.findBy('email', auth.use('activation').user?.email)
    if (!user) {
      throw new ModelNotFoundException('Invalid email to activate user')
    }
    if (user.isActivated) {
      throw new ConflictException(`User with email ${user.email} was already activated`)
    }

    user.emailVerifiedAt = DateTime.local()
    user.isActivated = true
    await user.save()

    await auth.use('activation').revoke()

    const successMsg = `Successfully activated user with email ${user.email}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
    } as BasicResponse)
  }

  public async login({ request, response, auth }: HttpContextContract): Promise<void> {
    const validatedData = await request.validate(LoginValidator)

    const user = await this.getAllDataUser(validatedData.email)
    if (!user) {
      throw new ModelNotFoundException(`Invalid email to login user`)
    }
    if (!user.isActivated) {
      throw new PermissionException('You need to activate your account')
    }
    if (user.lockedOut) {
      throw new PermissionException('You are locked out')
    }

    try {
      const tokenData = await auth.use('api').attempt(validatedData.email, validatedData.password, {
        expiresIn: Env.get('API_TOKEN_EXPIRY', '7days'),
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
      throw new ModelNotFoundException(`Invalid password to login user`)
    }
  }

  public async logout({ request, response, auth }: HttpContextContract) {
    const successMsg = `Successfully logged out user with email ${auth.use('api').user?.email}`

    await auth.use('api').revoke()

    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
    } as BasicResponse)
  }

  public async getLogged({ request, response, auth }: HttpContextContract) {
    const user = await this.getAllDataUser(auth.use('api').user?.email)
    if (!user) {
      throw new ModelNotFoundException(
        `Invalid auth email ${auth.use('api').user?.email} to get logged user`
      )
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
    const user = await User.query().where('email', auth.use('api').user?.email).first()

    let isAdmin = user && user.role === Roles.ADMIN ? true : false
    const successMsg = 'Successfully checked if user is admin'
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      isAdmin: isAdmin,
    } as IsAdminResponse)
  }

  public async update({ params: { id }, request, response, auth }: HttpContextContract) {
    let isAdmin = false
    const validAdminToken = await auth.use('api').check()
    const validToken = await auth.use('update').check()
    if (!validToken) {
      if (!validAdminToken || (validAdminToken && auth.use('api').user?.role !== Roles.ADMIN)) {
        throw new PermissionException(
          'Token is missing or has expirated to update email and/or password'
        )
      } else {
        isAdmin = true
      }
    }

    const user = isAdmin
      ? await User.find(id)
      : await User.findBy('email', auth.use('update').user?.email)
    if (!user) {
      if (isAdmin) {
        throw new ModelNotFoundException(`Invalid id ${id} updating user email and/or password`)
      } else {
        throw new ModelNotFoundException(
          `Invalid auth email ${auth.use('update').user?.email} updating user email and/or password`
        )
      }
    }

    const validatedData = await request.validate(UpdateAuthValidator)
    const newEmail = isAdmin ? validatedData.newEmail : auth.use('update').token?.meta?.new_email
    const newPassword = validatedData.newPassword

    if (newEmail && user.email !== newEmail) {
      const userWithEmail = await User.query().where('email', newEmail).first()
      if (userWithEmail) {
        throw new BadRequestException('Email must be unique to update user email and password')
      }
    }

    if (newEmail) {
      user.email = newEmail
    }
    if (newPassword) {
      user.password = newPassword
    }
    await user.save()

    await auth.use('api').revoke()
    await auth.use('update').revoke()

    const tokenData = await auth.use('api').generate(user, {
      expiresIn: Env.get('API_TOKEN_EXPIRY', '7days'),
    })

    const successMsg = `Successfully updated user email and/or password`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      token: tokenData.token,
      user: user,
    } as AuthResponse)
  }

  public async sendActivationEmail({ response, request, auth }: HttpContextContract) {
    const validatedData = await request.validate(SendActivationEmailValidator)

    const user = await User.findBy('email', validatedData.email)
    if (!user) {
      throw new ModelNotFoundException(
        `Invalid email ${validatedData.email} to send activation email`
      )
    }

    const tokenData = await auth.use('activation').generate(user, {
      expiresIn: Env.get('ACTIVATION_TOKEN_EXPIRY', '3h'),
    })

    await user.sendActivationEmail(
      validatedData.appName,
      validatedData.appDomain,
      validatedData.url + `?token=${tokenData.token}`
    )

    const successMsg = `Successfully sent activation email to ${user.email}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
    } as BasicResponse)
  }

  public async sendResetEmail({ response, request, auth }: HttpContextContract) {
    const validatedData = await request.validate(SendResetEmailValidator)

    const user = await User.findBy('email', validatedData.email)
    if (!user) {
      throw new ModelNotFoundException(`Invalid email ${validatedData.email} to send reset email`)
    }

    const tokenData = await auth.use('update').generate(user, {
      expiresIn: Env.get('UPDATE_TOKEN_EXPIRY', '3h'),
    })

    await user.sendResetEmail(
      validatedData.appName,
      validatedData.appDomain,
      validatedData.url + `?token=${tokenData.token}`
    )

    const successMsg = `Successfully sent reset email to ${user.email}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
    } as BasicResponse)
  }

  public async sendUpdateEmail({ response, request, auth }: HttpContextContract) {
    const user = await User.findBy('email', auth.use('api').user?.email)
    if (!user) {
      throw new ModelNotFoundException(
        `Invalid auth email ${auth.use('api').user?.email} to send update email`
      )
    }

    const validatedData = await request.validate(SendUpdateEmailValidator)

    const verifiedPassword = await Hash.verify(user.password, validatedData.password)
    if (!verifiedPassword) {
      throw new BadRequestException('Invalid password to send update email')
    }

    if (validatedData.newEmail && user.email !== validatedData.newEmail) {
      const userWithEmail = await User.query().where('email', validatedData.newEmail).first()
      if (userWithEmail) {
        throw new BadRequestException('Email must be unique to send update email')
      }
    }

    const tokenData = await auth.use('update').generate(user, {
      expiresIn: Env.get('UPDATE_TOKEN_EXPIRY', '3h'),
      new_email: validatedData.newEmail,
    })

    if (validatedData.newEmail && validatedData.newEmail !== user.email) {
      await user.sendUpdateEmail(
        validatedData.appName,
        validatedData.appDomain,
        validatedData.url + `?token=${tokenData.token}`,
        validatedData.newEmail,
        validatedData.revertEmail || false
      )
    }

    const successMsg = `Successfully sent update email to ${validatedData.newEmail}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
    } as BasicResponse)
  }

  private async getAllDataUser(email: string) {
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
