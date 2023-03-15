import Env from '@ioc:Adonis/Core/Env'

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { google } from 'googleapis'
import { JWT } from 'google-auth-library'

import { GoogleIndexerUrl } from 'App/Types/google'
import InternalServerException from 'App/Exceptions/InternalServerException'
import { GoogleIndexerActions } from 'App/Constants/google'

export default class GoogleService {
  private jwtClient: JWT

  constructor() {
    this.jwtClient = new google.auth.JWT(
      Env.get('GOOGLE_AUTH_CLIENT_EMAIL', ''),
      undefined,
      Env.get('GOOGLE_AUTH_PRIVATE_KEY', ''),
      ['https://www.googleapis.com/auth/indexing'],
      undefined
    )
  }

  private async getAccessToken() {
    return new Promise<{ googleAccessToken: string }>((resolve, reject) => {
      this.jwtClient.authorize((error, tokens) => {
        if (error || !tokens?.access_token) {
          reject(error ? error : new Error('Empty access token'))
        } else {
          resolve({
            googleAccessToken: tokens.access_token,
          })
        }
      })
    })
  }

  private async getAxiosOptions() {
    let accessToken = ''
    await this.getAccessToken()
      .then((response: { googleAccessToken: string }) => {
        accessToken = response.googleAccessToken
      })
      .catch((error) => {
        throw new InternalServerException(
          `Error getting Google API access token: ${error?.message}`
        )
      })
    const options: AxiosRequestConfig = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    }
    return options
  }

  private async updateIndexerUrl(url: GoogleIndexerUrl) {
    let result
    const options = await this.getAxiosOptions()
    await axios
      .post(
        'https://indexing.googleapis.com/v3/urlNotifications:publish',
        {
          url: url.value,
          type: url.action === GoogleIndexerActions.UPDATE ? 'URL_UPDATED' : 'URL_DELETED',
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

  private async fetchIndexerUrls(_urls: GoogleIndexerUrl[]) {}

  public async updateIndexer(urls: GoogleIndexerUrl[]) {
    let result
    if (urls.length === 1) {
      result = await this.updateIndexerUrl(urls[0])
    } else if (urls.length >= 2) {
      result = await this.fetchIndexerUrls(urls)
    }
    return result
  }
}
