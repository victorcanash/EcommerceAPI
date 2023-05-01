import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'

import { uploadImgExtensions } from 'App/Constants/multimedia'
import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class CreatePReviewValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    productId: schema.number.optional([rules.exists({ table: 'products', column: 'id' })]),
    packId: schema.number.optional([rules.exists({ table: 'product_packs', column: 'id' })]),
    rating: schema.number([rules.range(0, 5)]),
    title: schema.string.optional(),
    description: schema.string(),
    email: schema.string(),
    publicName: schema.string(),
    image: schema.file.optional({
      size: Env.get('CLOUDINARY_MAX_FILE_SIZE', '2mb'),
      extnames: uploadImgExtensions,
    }),
  })

  public messages: CustomMessages = {}
}
