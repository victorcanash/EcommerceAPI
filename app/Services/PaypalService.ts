import Env from '@ioc:Adonis/Core/Env'

import axios, { AxiosResponse } from 'axios'

import InternalServerException from 'App/Exceptions/InternalServerException'

export default class PaypalService {
  public static async getAccessToken() {
    let accessToken = ''
    const params = new URLSearchParams()
    params.append('grant_type', 'client_credentials')
    await axios
      .post(`${Env.get('PAYPAL_API')}/v1/oauth2/token`, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        auth: {
          username: Env.get('PAYPAL_CLIENT_ID', ''),
          password: Env.get('PAYPAL_CLIENT_SECRET', ''),
        },
      })
      .then((response: AxiosResponse) => {
        accessToken = response.data.access_token
      })
      .catch((error: Error) => {
        throw new InternalServerException(error.message)
      })

    return accessToken
  }

  public static async getClientToken(accessToken: string) {
    let clientToken = ''
    await axios
      .post(`${Env.get('PAYPAL_API')}/v1/identity/generate-token`, undefined, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      })
      .then((response: AxiosResponse) => {
        clientToken = response.data.client_token
      })
      .catch((error: Error) => {
        throw new InternalServerException(error.message)
      })

    return clientToken
  }

  public static async checkoutOrder(accessToken: string, order: any) {
    let orderId
    await axios
      .post(`${Env.get('PAYPAL_API')}/v2/checkout/orders`, order, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      })
      .then((response: AxiosResponse) => {
        orderId = response.data.id
        if (!orderId) {
          throw new InternalServerException('Something went wrong')
        }
      })
      .catch((error: Error) => {
        throw new InternalServerException(error.message)
      })

    return orderId
  }

  public static async captureOrder(authToken: string, orderId: string) {
    let data
    await axios
      .post(
        `${Env.get('PAYPAL_API')}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            'Prefer': 'return=representation',
          },
        }
      )
      .then((response: AxiosResponse) => {
        data = response.data
        if (!data) {
          throw new InternalServerException('Something went wrong')
        }
      })
      .catch((error: Error) => {
        throw new InternalServerException(error.message)
      })

    return data
  }
}
