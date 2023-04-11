import Env from '@ioc:Adonis/Core/Env'

import { v2 as cloudinary } from 'cloudinary'

import InternalServerException from 'App/Exceptions/InternalServerException'

export default class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: Env.get('CLOUDINARY_CLOUD_NAME', ''),
      api_key: Env.get('CLOUDINARY_API_KEY', ''),
      api_secret: Env.get('CLOUDINARY_API_SECRET', ''),
    })
  }

  public async uploadFile(filepath: string) {
    let publicId = ''
    await cloudinary.uploader
      .upload(filepath, { folder: Env.get('CLOUDINARY_REVIEWS_FOLDER', '') })
      .then((result) => {
        if (!result?.secure_url) {
          throw new InternalServerException('Something went wrong, empty cloudinary image url')
        }
        publicId = result.public_id
      })
      .catch((error) => {
        throw new InternalServerException(`Error uploading image to cloudinary: ${error.message}`)
      })
    return publicId
  }

  public getFile(publicId: string, width: number, height: number, crop = 'fill') {
    const url = cloudinary.url(publicId, {
      width: width,
      height: height,
      Crop: crop,
    })
    return url
  }
}
