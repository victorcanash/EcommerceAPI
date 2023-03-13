import Env from '@ioc:Adonis/Core/Env'

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { google } from 'googleapis'
import { JWT } from 'google-auth-library'

import InternalServerException from 'App/Exceptions/InternalServerException'

export default class GoogleAPIService {
  private jwtClient: JWT

  constructor() {
    this.jwtClient = new google.auth.JWT(
      Env.get('GOOGLE_API_CLIENT_EMAIL', ''),
      undefined,
      Env.get('GOOGLE_API_PRIVATE_KEY', ''),
      ['https://www.googleapis.com/auth/indexing'],
      undefined
    )
  }

  private async getAccessToken() {
    return new Promise<{ googleAccessToken: string }>((resolve, _reject) => {
      this.jwtClient.authorize((error, tokens) => {
        if (error || !tokens?.access_token) {
          throw new InternalServerException(
            `Error getting Google API access token: ${
              error?.message ? error.message : 'Empty access token'
            }`
          )
        }
        resolve({
          googleAccessToken: tokens.access_token,
        })
      })
    })
  }

  private async getAxiosOptions() {
    let accessToken = await this.getAccessToken()
    const options: AxiosRequestConfig = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    }
    return options
  }

  public async updateIndexerUrl(url: string) {
    let result
    const options = await this.getAxiosOptions()
    await axios
      .post(
        'https://indexing.googleapis.com/v3/urlNotifications:publish',
        {
          url: url,
          type: 'URL_UPDATED',
        },
        options
      )
      .then(async (response: AxiosResponse) => {
        if (response.status === 200) {
          result = response.data
        } else {
          throw new InternalServerException('Something went wrong')
        }
      })
      .catch((error) => {
        throw new InternalServerException(`Error updating Google API Indexer: ${error.message}`)
      })
    return result
  }
}
