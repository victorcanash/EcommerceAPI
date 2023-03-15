import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { google } from 'googleapis'
import { JWT } from 'google-auth-library'

import InternalServerException from 'App/Exceptions/InternalServerException'
import service_account from '../../service_account.json'

export default class GoogleAPIService {
  private jwtClient: JWT

  constructor() {
    this.jwtClient = new google.auth.JWT(
      service_account.client_email,
      undefined,
      service_account.private_key,
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
