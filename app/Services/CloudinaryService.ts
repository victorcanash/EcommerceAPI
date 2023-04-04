import Env from '@ioc:Adonis/Core/Env'

import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'

import InternalServerException from 'App/Exceptions/InternalServerException'

export default class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: Env.get('CLOUDINARY_CLOUD_NAME', ''),
      api_key: Env.get('CLOUDINARY_API_KEY', ''),
      api_secret: Env.get('CLOUDINARY_API_SECRET', ''),
    })
  }

  public async uploadFile(filepath: string, publicId: string) {
    let response = {} as UploadApiResponse
    await cloudinary.uploader
      .upload(filepath, { public_id: publicId })
      .then((result) => {
        response = result
      })
      .catch((error) => {
        throw new InternalServerException(error.message)
      })
    return response
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
