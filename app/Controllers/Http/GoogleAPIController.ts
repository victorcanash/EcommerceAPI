import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import GoogleAPIService from 'App/Services/GoogleAPIService'
import { GoogleAPIIndexerResponse } from 'App/Controllers/Http/types'
import StoreGoogleAPIIndexerValidator from 'App/Validators/GoogleAPI/StoreGoogleAPIIndexerValidator'
import { logRouteSuccess } from 'App/Utils/logger'

export default class GoogleAPIController {
  public async storeIndexer({ request, response }: HttpContextContract) {
    const validatedData = await request.validate(StoreGoogleAPIIndexerValidator)

    const result = await new GoogleAPIService().updateIndexerUrl(validatedData.url)

    const successMsg = 'Successfully updated Google API Indexer'
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      result: result,
    } as GoogleAPIIndexerResponse)
  }
}
