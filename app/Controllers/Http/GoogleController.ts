import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import GoogleService from 'App/Services/GoogleService'
import { GoogleAPIIndexerResponse } from 'App/Controllers/Http/types'
import UpdateGoogleIndexerValidator from 'App/Validators/Google/UpdateGoogleIndexerValidator'
import { logRouteSuccess } from 'App/Utils/logger'

export default class GoogleController {
  public async updateGoogleIndexer({ request, response }: HttpContextContract) {
    const validatedData = await request.validate(UpdateGoogleIndexerValidator)

    const result = await new GoogleService().updateGoogleIndexer(validatedData.urls)

    const successMsg = 'Successfully updated urls for Google API Indexer'
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      result: result,
    } as GoogleAPIIndexerResponse)
  }
}
