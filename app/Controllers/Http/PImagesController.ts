import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Drive from '@ioc:Adonis/Core/Drive'

import ProductsService from 'App/Services/ProductsService'
import { PImagesResponse } from 'App/Controllers/Http/types'
import BadRequestException from 'App/Exceptions/BadRequestException'
import { logRouteSuccess } from 'App/Utils/logger'
import { generateUniqueFilename } from 'App/Utils/uploader'

export default class PImagesController {
  public async show({ params: { product_id, id }, request, response }: HttpContextContract) {
    const product = await ProductsService.getProductById(product_id, false)

    const image = await ProductsService.getImageById(product, id)

    const readableStream = await Drive.getStream(image)

    const successMsg = `Successfully got product image by product id ${product_id} and image id ${id}`
    logRouteSuccess(request, successMsg)
    response.stream(readableStream)
  }

  public async store({ params: { product_id }, request, response }: HttpContextContract) {
    const product = await ProductsService.getProductById(product_id, false)

    const validatedData = await request.files('images', {
      size: '2mb',
      extnames: ['jpg', 'jpeg', 'gif', 'png'],
    })
    if (validatedData.length < 1) {
      throw new BadRequestException('Images field must contain at least 1 file')
    }

    const productImages = product.imageNames
    validatedData.forEach((image) => {
      const imageName = generateUniqueFilename(image.clientName)
      image.moveToDisk('./', {
        name: imageName,
      })
      productImages.push(imageName)
    })
    product.merge({
      images: productImages.toString(),
    })
    await product.save()

    const successMsg = `Successfully uploaded product images by product id ${product_id}`
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      productImages: productImages,
    } as PImagesResponse)
  }

  public async destroy({ params: { product_id, id }, request, response }: HttpContextContract) {
    const product = await ProductsService.getProductById(product_id, false)

    const image = await ProductsService.getImageById(product, id)

    const productImages = product.imageNames
    await Drive.delete(image)
    productImages.splice(id, 1)
    product.merge({
      images: productImages.toString(),
    })
    await product.save()

    const successMsg = `Successfully deleted product image by product id ${product_id} and image id ${id}`
    logRouteSuccess(request, successMsg)
    return response.ok({
      code: 200,
      message: successMsg,
      productImages: productImages,
    } as PImagesResponse)
  }
}
