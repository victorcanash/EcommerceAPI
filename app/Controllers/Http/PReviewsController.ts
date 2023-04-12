import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Application from '@ioc:Adonis/Core/Application'

import { defaultPage, defaultLimit, defaultOrder, defaultSortBy } from 'App/Constants/lists'
import ProductReview from 'App/Models/ProductReview'
import ProductPack from 'App/Models/ProductPack'
import User from 'App/Models/User'
import GuestUser from 'App/Models/GuestUser'
import Order from 'App/Models/Order'
import { PReviewsResponse, PReviewResponse, BasicResponse } from 'App/Controllers/Http/types'
import ProductsService from 'App/Services/ProductsService'
import UsersService from 'App/Services/UsersService'
import CloudinaryService from 'App/Services/CloudinaryService'
import { logRouteSuccess } from 'App/Utils/logger'
import { generateUniqueFilename } from 'App/Utils/uploader'
import PaginationValidator from 'App/Validators/List/PaginationValidator'
import SortValidator from 'App/Validators/List/SortValidator'
import CreatePReviewValidator from 'App/Validators/Product/CreatePReviewValidator'
import UpdatePReviewValidator from 'App/Validators/Product/UpdatePReviewValidator'
import PermissionException from 'App/Exceptions/PermissionException'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'

export default class PReviewsController {
  public async index({ request, response }: HttpContextContract) {
    const validatedPaginationData = await request.validate(PaginationValidator)
    const page = validatedPaginationData.page || defaultPage
    const limit = validatedPaginationData.limit || defaultLimit

    const validatedSortData = await request.validate(SortValidator)
    const sortBy = validatedSortData.sortBy || defaultSortBy
    const order = validatedSortData.order || defaultOrder

    const reviews = await ProductReview.query().orderBy(sortBy, order).paginate(page, limit)
    const result = reviews.toJSON()

    const successMsg = 'Successfully got product reviews'
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      productReviews: result.data,
      totalPages: Math.ceil(result.meta.total / limit),
      currentPage: result.meta.current_page as number,
    } as PReviewsResponse)
  }

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
    const isAuthAdmin = !validApiToken ? false : await UsersService.isAuthAdmin(auth)
    let user: User | undefined
    let guestUser: GuestUser | undefined
    let email = validatedData.email
    let publicName = validatedData.publicName
    if (!validApiToken) {
      guestUser = (await UsersService.getOptionalGuestUserByEmail(email)) || undefined
      if (!guestUser) {
        const loggedUser = await UsersService.getOptionalUserByEmail(email, false)
        if (loggedUser) {
          throw new PermissionException('You have to be logged to use this email')
        }
        throw new ModelNotFoundException(`Invalid email ${email} getting guest user`)
      }
    } else {
      email = await UsersService.getAuthEmail(auth)
      if (email !== validatedData.email) {
        throw new PermissionException('Email entered does not belong to the logged user')
      }
      user = await UsersService.getUserByEmail(email, false)
      publicName = `${user.firstName} ${user.lastName}`
    }

    // Check if the user has bought the related product
    if (!isAuthAdmin) {
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

    // Recalculate product rating
    if (inventory) {
      await ProductsService.calculateInventoryRating(inventory)
    } else if (pack) {
      await ProductsService.calculatePackRating(pack)
    }

    const successMsg = `Successfully created product review by email ${email}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      productReview: productReview,
    } as PReviewResponse)
  }

  public async update({ params: { id }, request, response }: HttpContextContract) {
    const productReview = await ProductsService.getReviewById(id)

    const validatedData = await request.validate(UpdatePReviewValidator)

    productReview.merge(validatedData)
    await productReview.save()

    // Recalculate product rating
    if (productReview.inventoryId) {
      const inventory = await ProductsService.getInventoryById(productReview.inventoryId)
      await ProductsService.calculateInventoryRating(inventory)
    } else if (productReview.packId) {
      const pack = await ProductsService.getPackById(productReview.packId)
      await ProductsService.calculatePackRating(pack)
    }

    const successMsg = `Successfully updated product review by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      productReview: productReview,
    } as PReviewResponse)
  }

  public async destroy({ params: { id }, request, response }: HttpContextContract) {
    const productReview = await ProductsService.getReviewById(id)

    await productReview.delete()

    const successMsg = `Successfully deleted product review by id ${id}`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
    } as BasicResponse)
  }
}
