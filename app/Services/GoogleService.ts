import Env from '@ioc:Adonis/Core/Env'

import axios, { AxiosResponse } from 'axios'
import { google } from 'googleapis'
import { JWT, OAuth2Client } from 'google-auth-library'

import { GoogleIndexerUrl } from 'App/Types/google'
import InternalServerException from 'App/Exceptions/InternalServerException'
import { GoogleIndexerActions } from 'App/Constants/google'

export default class GoogleService {
  private jwtClient: JWT
  private oauth2Client: OAuth2Client

  constructor() {
    this.jwtClient = new google.auth.JWT(
      Env.get('GOOGLE_AUTH_CLIENT_EMAIL', ''),
      undefined,
      Env.get('GOOGLE_AUTH_PRIVATE_KEY', ''),
      ['https://www.googleapis.com/auth/indexing'],
      undefined
    )
    this.oauth2Client = new google.auth.OAuth2(
      Env.get('GOOGLE_OAUTH_CLIENT_ID', ''),
      Env.get('GOOGLE_OAUTH_CLIENT_SECRET', '')
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

  private async getOAuth2AccessToken(code: string) {
    return new Promise<{ googleAccessToken: string }>((resolve, reject) => {
      this.oauth2Client
        .getToken(code)
        .then((response) => {
          if (!response.tokens?.access_token) {
            reject(new Error('Empty access token'))
          } else {
            this.oauth2Client.setCredentials(response.tokens)
            resolve({
              googleAccessToken: response.tokens.access_token,
            })
          }
        })
        .catch((error) => {
          reject(error)
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

  private async getOAuth2Headers(code: string) {
    let accessToken = ''
    await this.getOAuth2AccessToken(code)
      .then((response: { googleAccessToken: string }) => {
        accessToken = response.googleAccessToken
      })
      .catch((error) => {
        throw new InternalServerException(
          `Error getting Google API OAuth2 access token: ${error?.message}`
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

  public async getOAuthClientUserInfo(code: string) {
    let result
    const authHeaders = await this.getOAuth2Headers(code)
    await axios
      .get('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
        headers: {
          ...authHeaders,
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
