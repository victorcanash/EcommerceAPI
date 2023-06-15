import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'
import Hash from '@ioc:Adonis/Core/Hash'
import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'

import { Providers } from 'App/Constants/auth'
import User from 'App/Models/User'
import Cart from 'App/Models/Cart'
import { GuestCartCheck } from 'App/Types/cart'
import {
  BasicResponse,
  InitAuthResponse,
  AuthResponse,
  IsAdminResponse,
} from 'App/Controllers/Http/types'
import UsersService from 'App/Services/UsersService'
import CartsService from 'App/Services/CartsService'
import PaypalService from 'App/Services/PaypalService'
import MailService from 'App/Services/MailService'
import GoogleService from 'App/Services/GoogleService'
import InitValidator from 'App/Validators/Auth/InitValidator'
import LoginValidator from 'App/Validators/Auth/LoginValidator'
import LoginGoogleValidator from 'App/Validators/Auth/LoginGoogleValidator'
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
  public async init({ request, response, auth, i18n }: HttpContextContract) {
    const validatedData = await request.validate(InitValidator)
    // User Auth
    const validToken = await auth.use('api').check()
    let user: User | undefined
    let guestCart: GuestCartCheck | undefined
    if (validToken) {
      const email = await UsersService.getAuthEmail(auth)
      user = await UsersService.getUserByEmail(email, true)
    } else {
      guestCart = await CartsService.createGuestCartCheck(validatedData.guestCart?.items)
    }
    // Paypal Auth
    const paypalToken = await PaypalService.generateClientToken(i18n)

    const successMsg = `Successfully init user`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      // User Auth
      user: user,
      guestCart: guestCart,
      // Paypal Auth
      paypal: {
        token: paypalToken,
        advancedCards: Env.get('PAYPAL_ADVANCED_CARDS') === 'enabled' ? true : false,
      },
    } as InitAuthResponse)
  }

  public async activate({ response, request, auth }: HttpContextContract) {
    const email = await UsersService.getAuthEmail(auth, 'activation')
    const user = await UsersService.getUserByEmail(email, false)

    await auth.use('activation').revoke()

    if (user.isActivated) {
      throw new ConflictException(`User with email ${email} was already activated`)
    }
    if (user.lockedOut) {
      throw new PermissionException(`User with email ${email} is locked out`)
    }

    user.emailVerifiedAt = DateTime.local()
    user.isActivated = true
    await user.save()

    const successMsg = `Successfully activated user with email ${email}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
    } as BasicResponse)
  }

  public async login({ request, response, auth }: HttpContextContract): Promise<void> {
    const validatedData = await request.validate(LoginValidator)

    let user = await UsersService.getUserByEmail(validatedData.email, true)
    if (user.authProvider) {
      throw new PermissionException(
        `User with email ${validatedData.email} was created with another provider`
      )
    }
    /*if (!user.isActivated) {
      throw new ConflictException(`User with email ${validatedData.email} is not activated yet`)
    }*/
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

    user = await UsersService.addGuestCart(user, validatedData.guestCart?.items)

    const successMsg = `Successfully logged in user with email ${user.email}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      token: tokenData.token,
      user: user,
    } as AuthResponse)
  }

  public async loginGoogle({ request, response, auth }: HttpContextContract): Promise<void> {
    const validatedData = await request.validate(LoginGoogleValidator)

    const result = await GoogleService.getOAuthClientUserInfo(validatedData.accessToken)

    let user = await UsersService.getOptionalUserByEmail(result.email, true)
    if (!user) {
      const newUser = await User.create({
        email: result.email,
        password: `google-${uuidv4()}`,
        firstName: result.given_name,
        lastName: result.family_name,
        birthday: undefined,
        getEmails: true,
        emailVerifiedAt: DateTime.local(),
        isActivated: true,
        authProvider: Providers.GOOGLE,
      })
      await Cart.create({ userId: newUser.id })
      user = await UsersService.getUserByEmail(newUser.email, true)
    } else {
      if (user.authProvider !== Providers.GOOGLE) {
        throw new PermissionException(
          `User with email ${result.email} was created with another provider`
        )
      }
    }
    if (user.lockedOut) {
      throw new PermissionException(`User with email ${result.email} is locked out`)
    }

    const tokenData = await auth.use('api').generate(user, {
      expiresIn: Env.get('API_TOKEN_EXPIRY', '7days'),
    })

    user = await UsersService.addGuestCart(user, validatedData.guestCart?.items)

    const successMsg = `Successfully logged in user with Google email ${result.email}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      token: tokenData.token,
      user: user,
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

  public async sendActivationEmail({ response, request, auth, i18n }: HttpContextContract) {
    const validatedData = await request.validate(SendActivationEmailValidator)

    const user = await UsersService.getUserByEmail(validatedData.email, false)

    const tokenData = await auth.use('activation').generate(user, {
      expiresIn: Env.get('ACTIVATION_TOKEN_EXPIRY', '3h'),
    })

    await MailService.sendActivationEmail(
      user,
      i18n,
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

  public async sendResetPswEmail({ response, request, auth, i18n }: HttpContextContract) {
    const validatedData = await request.validate(SendResetPswEmailValidator)

    const user = await UsersService.getUserByEmail(validatedData.email, false)

    const tokenData = await auth.use('update').generate(user, {
      expiresIn: Env.get('UPDATE_TOKEN_EXPIRY', '3h'),
    })

    await MailService.sendResetPswEmail(
      user,
      i18n,
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

  public async sendUpdateEmail({ response, request, auth, i18n }: HttpContextContract) {
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
      await MailService.sendUpdateEmail(
        user,
        i18n,
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
