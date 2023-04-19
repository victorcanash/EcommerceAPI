import Env from '@ioc:Adonis/Core/Env'

import axios, { AxiosResponse } from 'axios'
import { google } from 'googleapis'
import { JWT } from 'google-auth-library'

import { GoogleIndexerUrl } from 'App/Types/google'
import InternalServerException from 'App/Exceptions/InternalServerException'
import { GoogleIndexerActions } from 'App/Constants/google'

export default class GoogleService {
  private jwtClient: JWT

  constructor() {
    const privateKey = Env.get('GOOGLE_AUTH_PRIVATE_KEY', '').replace(/\\n/gm, '\n')
    this.jwtClient = new google.auth.JWT(
      Env.get('GOOGLE_AUTH_CLIENT_EMAIL', ''),
      undefined,
      privateKey,
      ['https://www.googleapis.com/auth/indexing'],
      undefined
    )
  }

  private async getJWTAccessToken() {
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

  private async getJWTAuthHeaders() {
    let accessToken = ''
    await this.getJWTAccessToken()
      .then((response: { googleAccessToken: string }) => {
        accessToken = response.googleAccessToken
      })
      .catch((error) => {
        throw new InternalServerException(
          `Error getting Google API JWT access token: ${error?.message}`
        )
      })
    return {
      Authorization: `Bearer ${accessToken}`,
    }
  }

  public async updateGoogleIndexer(urls: GoogleIndexerUrl[]) {
    let result
    const authHeaders = await this.getJWTAuthHeaders()
    const requests = urls.map((item) => {
      return axios.post(
        'https://indexing.googleapis.com/v3/urlNotifications:publish',
        {
          url: item.value,
          type: item.action === GoogleIndexerActions.UPDATE ? 'URL_UPDATED' : 'URL_DELETED',
        },
        {
          headers: {
            ...authHeaders,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      )
    })
    await axios
      .all(requests)
      .then((response: AxiosResponse[]) => {
        result = response.map((item) => {
          return item.data
        })
      })
      .catch((error) => {
        throw new InternalServerException(`Error updating Google API Indexer: ${error.message}`)
      })
    return result
  }

  public static async getOAuthClientUserInfo(accessToken: string) {
    let result
    await axios
      .get('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })
      .then((response: AxiosResponse) => {
        result = response.data
      })
      .catch((error) => {
        throw new InternalServerException(`Error getting Google user info: ${error.message}`)
      })
    return result
  }
}
