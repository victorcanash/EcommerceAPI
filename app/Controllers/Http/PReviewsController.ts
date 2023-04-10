import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Application from '@ioc:Adonis/Core/Application'

import ProductReview from 'App/Models/ProductReview'
import ProductPack from 'App/Models/ProductPack'
import User from 'App/Models/User'
import GuestUser from 'App/Models/GuestUser'
import Order from 'App/Models/Order'
import { PReviewResponse } from 'App/Controllers/Http/types'
import ProductsService from 'App/Services/ProductsService'
import UsersService from 'App/Services/UsersService'
import CloudinaryService from 'App/Services/CloudinaryService'
import { logRouteSuccess } from 'App/Utils/logger'
import { generateUniqueFilename } from 'App/Utils/uploader'
import CreatePReviewValidator from 'App/Validators/Product/CreatePReviewValidator'
import PermissionException from 'App/Exceptions/PermissionException'

export default class PReviewsController {
  public async store({ request, response, auth }: HttpContextContract) {
    const validatedData = await request.validate(CreatePReviewValidator)

    // Get Related Product
    const inventory = validatedData.inventoryId
      ? await ProductsService.getInventoryById(validatedData.inventoryId)
      : undefined
    let pack: ProductPack | undefined
    if (!inventory) {
      pack = await ProductsService.getPackById(validatedData.packId || -1)
    }

    // Get User
    const validApiToken = await auth.use('api').check()
    let user: User | undefined
    let guestUser: GuestUser | undefined
    let email = validatedData.email
    let publicName = validatedData.publicName
    if (!validApiToken) {
      guestUser = await UsersService.getGuestUserByEmail(email)
    } else {
      email = await UsersService.getAuthEmail(auth)
      if (email !== validatedData.email) {
        throw new PermissionException('Email entered does not belong to the logged user')
      }
      user = await UsersService.getUserByEmail(email, false)
      publicName = `${user.firstName} ${user.lastName}`
    }

    // Check if the user has bought the related product
    const order = await Order.query()
      .where(user ? 'userId' : 'guestUserId', user ? user.id : guestUser?.id || -1)
      .whereJsonSuperset(
        'products',
        inventory ? [{ inventoryId: inventory?.id }] : [{ packId: pack?.id }]
      )
      .first()
    if (!order) {
      throw new PermissionException('You have not bought the related product')
    }

    // Upload image
    let cloudinaryImgUrl: string | undefined
    const validatedImg = validatedData.image
    if (validatedImg) {
      const imageName = generateUniqueFilename(validatedImg.clientName)
      await validatedImg.moveToDisk('./', {
        name: imageName,
      })
      cloudinaryImgUrl = await new CloudinaryService().uploadFile(
        `${Application.tmpPath('uploads')}/${imageName}`
      )
    }

    // Create product review
    const productReview = await ProductReview.create({
      userId: user?.id,
      guestUserId: guestUser?.id,
      inventoryId: inventory?.id,
      packId: pack?.id,
      rating: validatedData.rating,
      title: validatedData.title,
      description: validatedData.description,
      email: email,
      publicName: publicName,
      imageUrl: cloudinaryImgUrl,
    })

    const successMsg = `Successfully created product review by email ${email}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      productReview: productReview,
    } as PReviewResponse)
  }
}
