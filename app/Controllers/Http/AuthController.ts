import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'
import Hash from '@ioc:Adonis/Core/Hash'
import { DateTime } from 'luxon'

import UsersService from 'App/Services/UsersService'
import BraintreeService from 'App/Services/BraintreeService'
import {
  BasicResponse,
  AuthResponse,
  IsAdminResponse,
  UserResponse,
} from 'App/Controllers/Http/types'
import LoginValidator from 'App/Validators/Auth/LoginValidator'
import UpdateAuthValidator from 'App/Validators/Auth/UpdateAuthValidator'
import SendActivationEmailValidator from 'App/Validators/Auth/SendActivationEmailValidator'
import SendResetPswEmailValidator from 'App/Validators/Auth/SendResetPswEmailValidator'
import SendUpdateEmailValidator from 'App/Validators/Auth/SendUpdateEmailValidator'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'
import BadRequestException from 'App/Exceptions/BadRequestException'
import PermissionException from 'App/Exceptions/PermissionException'
import ConflictException from 'App/Exceptions/ConflictException'
import { logRouteSuccess } from 'App/Utils/logger'

export default class AuthController {
  public async activate({ response, request, auth }: HttpContextContract) {
    const email = await UsersService.getAuthEmail(auth, 'activation')
    const user = await UsersService.getUserByEmail(email, false)
    if (user.isActivated) {
      throw new ConflictException(`User with email ${email} was already activated`)
    }
    if (user.lockedOut) {
      throw new PermissionException(`User with email ${email} is locked out`)
    }

    user.emailVerifiedAt = DateTime.local()
    user.isActivated = true
    await user.save()

    await auth.use('activation').revoke()

    const successMsg = `Successfully activated user with email ${email}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
    } as BasicResponse)
  }

  public async login({ request, response, auth }: HttpContextContract): Promise<void> {
    const validatedData = await request.validate(LoginValidator)

    const user = await UsersService.getUserByEmail(validatedData.email, true)
    if (!user.isActivated) {
      throw new ConflictException(`User with email ${validatedData.email} was already activated`)
    }
    if (user.lockedOut) {
      throw new PermissionException(`User with email ${validatedData.email} is locked out`)
    }

    const tokenData = await auth
      .use('api')
      .attempt(validatedData.email, validatedData.password, {
        expiresIn: Env.get('API_TOKEN_EXPIRY', '7days'),
      })
      .catch((_error) => {
        throw new ModelNotFoundException(`Invalid password to login user`)
      })

    const braintreeService = new BraintreeService()
    let braintreeToken = await braintreeService.generateClientToken(user.braintreeId)

    const successMsg = `Successfully logged in user with email ${user.email}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      token: tokenData.token,
      user: user,
      braintreeToken: braintreeToken,
    } as AuthResponse)
  }

  public async logout({ request, response, auth }: HttpContextContract) {
    const email = await UsersService.getAuthEmail(auth)

    await auth.use('api').revoke()

    const successMsg = `Successfully logged out user with email ${email}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
    } as BasicResponse)
  }

  public async getLogged({ request, response, auth }: HttpContextContract) {
    const email = await UsersService.getAuthEmail(auth)
    const user = await UsersService.getUserByEmail(email, true)

    const braintreeService = new BraintreeService()
    let braintreeToken = await braintreeService.generateClientToken(user.braintreeId)

    const successMsg = `Successfully got logged user`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      user: user,
      braintreeToken: braintreeToken,
    } as UserResponse)
  }

  public async isAdmin({ request, response, auth }: HttpContextContract) {
    const isAdmin = await UsersService.isAuthAdmin(auth)

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
    const validToken = await auth.use('update').check()
    if (!validToken) {
      if (!UsersService.isAuthAdmin(auth)) {
        throw new PermissionException(
          'Token is missing or has expirated to update email and/or password'
        )
      } else {
        isAdmin = true
      }
    }

    const email = await UsersService.getAuthEmail(auth, 'update')
    const user = isAdmin
      ? await UsersService.getUserById(id, true)
      : await UsersService.getUserByEmail(email, true)

    const validatedData = await request.validate(UpdateAuthValidator)
    const newEmail = isAdmin ? validatedData.newEmail : auth.use('update').token?.meta?.new_email
    const newPassword = validatedData.newPassword

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

    const user = await UsersService.getUserByEmail(validatedData.email, false)

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

  public async sendResetPswEmail({ response, request, auth }: HttpContextContract) {
    const validatedData = await request.validate(SendResetPswEmailValidator)

    const user = await UsersService.getUserByEmail(validatedData.email, false)

    const tokenData = await auth.use('update').generate(user, {
      expiresIn: Env.get('UPDATE_TOKEN_EXPIRY', '3h'),
    })

    await user.sendResetPswEmail(
      validatedData.appName,
      validatedData.appDomain,
      validatedData.url + `?token=${tokenData.token}`
    )

    const successMsg = `Successfully sent reset psw email to ${user.email}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
    } as BasicResponse)
  }

  public async sendUpdateEmail({ response, request, auth }: HttpContextContract) {
    const email = await UsersService.getAuthEmail(auth)
    const user = await UsersService.getUserByEmail(email, false)

    const validatedData = await request.validate(SendUpdateEmailValidator)

    const verifiedPassword = await Hash.verify(user.password, validatedData.password)
    if (!verifiedPassword) {
      throw new BadRequestException('Invalid password to send update email')
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
}
