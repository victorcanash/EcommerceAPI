import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'
import Hash from '@ioc:Adonis/Core/Hash'
import { DateTime } from 'luxon'

import User from 'App/Models/User'
import Product from 'App/Models/Product'
import ProductCategory from 'App/Models/ProductCategory'
import ProductPack from 'App/Models/ProductPack'
import UsersService from 'App/Services/UsersService'
import CartsService from 'App/Services/CartsService'
import BraintreeService from 'App/Services/BraintreeService'
import PaypalService from 'App/Services/PaypalService'
import MailService from 'App/Services/MailService'
import GoogleService from 'App/Services/GoogleService'
import {
  BasicResponse,
  InitAuthResponse,
  AuthResponse,
  IsAdminResponse,
  BraintreeTokenResponse,
} from 'App/Controllers/Http/types'
import { PaymentModes } from 'App/Constants/payment'
import { GuestCartCheck } from 'App/Types/cart'
import InitValidator from 'App/Validators/Auth/InitValidator'
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
  public async init({ request, response, auth, i18n }: HttpContextContract) {
    const validatedData = await request.validate(InitValidator)

    const categoryIds = validatedData.categoryIds || []
    const productIds = validatedData.productIds || []
    const packIds = validatedData.packIds || []
    const categories = await ProductCategory.query().where((query) => {
      if (categoryIds.length > 0) {
        query.whereIn('id', categoryIds)
      }
    })
    const products = await Product.query()
      .where((query) => {
        if (productIds.length > 0) {
          query.whereIn('id', productIds)
        }
      })
      .apply((scopes) => {
        scopes.getAllData()
      })
    const packs = await ProductPack.query().where((query) => {
      if (packIds.length > 0) {
        query.whereIn('id', packIds)
      }
    })

    const validToken = await auth.use('api').check()
    let user: User | undefined
    let guestCart: GuestCartCheck | undefined
    if (validToken) {
      const email = await UsersService.getAuthEmail(auth)
      user = await UsersService.getUserByEmail(email, true)
    } else {
      guestCart = await CartsService.createGuestCartCheck(validatedData.guestCart?.items)
    }

    const braintreeToken = await new BraintreeService().generateClientToken(user?.braintreeId)
    const paypalToken = await PaypalService.generateClientToken(i18n)

    const successMsg = `Successfully init user`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      categories: categories,
      products: products,
      packs: packs,
      user: user,
      guestCart: guestCart,
      paymentMode: Env.get('PAYMENT_MODE', PaymentModes.BRAINTREE),
      currency: Env.get('CURRENCY', 'EUR'),
      confirmTokenExpiry: Env.get('CONFIRMATION_TOKEN_EXPIRY', '30mins'),
      braintreeToken: braintreeToken,
      paypal: {
        merchantId: Env.get('PAYPAL_MERCHANT_ID'),
        clientId: Env.get('PAYPAL_CLIENT_ID'),
        token: paypalToken,
        advancedCards: Env.get('PAYPAL_ADVANCED_CARDS') === 'enabled' ? true : false,
      },
      google: {
        oauthId: Env.get('GOOGLE_OAUTH_CLIENT_ID', ''),
        oauthRedirect: `${Env.get('APP_URL', 'http://localhost:3333/api')}/auth/login/google`,
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
    if (!user.isActivated) {
      throw new ConflictException(`User with email ${validatedData.email} is not activated yet`)
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

    user = await UsersService.addGuestCart(user, validatedData.guestCart?.items)

    const braintreeToken = await new BraintreeService().generateClientToken(user.braintreeId)

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

  public async loginGoogle({
    // params: { error, state, code, scope, authuser, hd, prompt },
    params: { error, code },
    request,
    response,
  }: HttpContextContract): Promise<void> {
    if (error) {
      throw new PermissionException('Access denied to login with google')
    }
    const result = await new GoogleService().getOAuthClientUserInfo(code)

    const successMsg = `Successfully logged in user with Google email `
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      result: result,
    })
  }

  public async logout({ request, response, auth }: HttpContextContract) {
    const email = await UsersService.getAuthEmail(auth)

    await auth.use('api').revoke()

    const braintreeToken = await new BraintreeService().generateClientToken()

    const successMsg = `Successfully logged out user with email ${email}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      braintreeToken: braintreeToken,
    } as BraintreeTokenResponse)
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
