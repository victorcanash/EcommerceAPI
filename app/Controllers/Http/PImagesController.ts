import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Drive from '@ioc:Adonis/Core/Drive'

import Product from 'App/Models/Product'
import { PImagesResponse } from 'App/Controllers/Http/types'
import UploadPImagesValidator from 'App/Validators/Product/UploadPImagesValidator'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'
import FileNotFoundException from 'App/Exceptions/FileNotFoundException'
import { logRouteSuccess } from 'App/Utils/logger'
import { generateUniqueFilename } from 'App/Utils/uploader'

export default class ProductsController {
  public async show({ params: { product_id, id }, request, response }: HttpContextContract) {
    const product = await Product.find(product_id)
    if (!product) {
      throw new ModelNotFoundException(`Invalid product id ${product_id} getting product image`)
    }

    const productImages = product.imageNames
    if (!productImages || productImages.length <= id) {
      throw new FileNotFoundException(`Invalid image id ${id} getting product image`)
    }

    if (!(await Drive.exists(productImages[id]))) {
      throw new FileNotFoundException(
        `Not found image name ${productImages[id]} in drive disk getting product image`
      )
    }
    const readableStream = await Drive.getStream(productImages[id])

    const successMsg = `Successfully got product image by product id ${product_id} and image id ${id}`
    logRouteSuccess(request, successMsg)
    response.stream(readableStream)
  }

  public async store({ params: { product_id }, request, response }: HttpContextContract) {
    const product = await Product.find(product_id)
    if (!product) {
      throw new ModelNotFoundException(`Invalid product id ${product_id} uploading product images`)
    }

    const validatedData = await request.validate(UploadPImagesValidator)

    const productImages = product.imageNames

    validatedData.images.forEach((image) => {
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
    return response.ok({
      code: 201,
      message: successMsg,
      productImages: productImages,
    } as PImagesResponse)
  }

  public async destroy({ params: { product_id, id }, request, response }: HttpContextContract) {
    const product = await Product.find(product_id)
    if (!product) {
      throw new ModelNotFoundException(`Invalid product id ${product_id} deleting product image`)
    }

    const productImages = product.imageNames
    if (!productImages || productImages.length <= id) {
      throw new FileNotFoundException(`Invalid image id ${id} deleting product image`)
    }

    if (await Drive.exists(productImages[id])) {
      await Drive.delete(productImages[id])
    } else {
      throw new FileNotFoundException(
        `Not found image name ${productImages[id]} in drive disk deleting product image`
      )
    }
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
