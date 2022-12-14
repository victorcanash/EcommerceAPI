import Env from '@ioc:Adonis/Core/Env'

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

import { CountryOptions } from 'App/constants/addresses'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'
import InternalServerException from 'App/Exceptions/InternalServerException'
import { getCountryCode } from 'App/Utils/addresses'

export default class BigbuyService {
  public static async getProductInfo(sku: string) {
    let result = {
      id: 0,
      name: '',
      description: '',
      price: 0,
    }
    const options: AxiosRequestConfig = {
      headers: this.getAuthHeaders(),
    }
    await axios
      .get(
        `${Env.get('BIGBUY_API_URL')}/rest/catalog/productinformationbysku/${sku}.json?isoCode=es`,
        options
      )
      .then(async (response: AxiosResponse) => {
        if (response.status === 200 && response.data && response.data.length > 0) {
          result = response.data[0]
        } else {
          throw new Error('Something went wrong')
        }
      })
      .catch((error) => {
        throw new ModelNotFoundException(error.message)
      })
    return result
  }

  public static async getProductQuantity(bigbuyId: number) {
    let quantity = 0
    const options: AxiosRequestConfig = {
      headers: this.getAuthHeaders(),
    }
    await axios
      .get(`${Env.get('BIGBUY_API_URL')}/rest/catalog/productstock/${bigbuyId}.json`, options)
      .then(async (response: AxiosResponse) => {
        if (response.status === 200) {
          if (response.data.stocks && response.data.stocks.length > 0) {
            response.data.stocks.forEach((item) => {
              quantity += item.quantity
            })
          }
        } else {
          throw new Error('Something went wrong')
        }
      })
      .catch((error) => {
        throw new ModelNotFoundException(error.message)
      })
    return quantity
  }

  public static async getOrderInfo(orderId: string) {
    let result = {
      id: 0,
      status: '',
      shippingAddress: {
        firstName: '',
        lastName: '',
        country: '',
        postcode: '',
        town: '',
        address: '',
        phone: '',
        email: '',
        companyName: '',
      },
      products: [] as {
        id: string
        reference: string
        quantity: number
        name: string
      }[],
    }
    const options: AxiosRequestConfig = {
      headers: this.getAuthHeaders(),
    }
    await axios
      .get(`${Env.get('BIGBUY_API_URL')}/rest/order/reference/${orderId}.json`, options)
      .then(async (response: AxiosResponse) => {
        if (response.status === 200) {
          result.id = response.data.id
        } else {
          throw new Error('Something went wrong')
        }
      })
      .catch((error) => {
        throw new ModelNotFoundException(error.message)
      })
    await axios
      .get(`${Env.get('BIGBUY_API_URL')}/rest/order/${result.id}.json`, options)
      .then(async (response: AxiosResponse) => {
        if (response.status === 200) {
          result = response.data
        } else {
          throw new Error('Something went wrong')
        }
      })
      .catch((error) => {
        throw new ModelNotFoundException(error.message)
      })
    return result
  }

  public static async createOrder(
    internalReference: string,
    email: string,
    shipping: {
      firstName: string
      lastName: string
      addressLine1: string
      addressLine2?: string
      postalCode: string
      locality: string
      country: CountryOptions
    },
    products: (
      | {
          reference: string
          quantity: number
          internalReference: string
        }
      | undefined
    )[]
  ) {
    let orderId = ''
    const options: AxiosRequestConfig = {
      headers: this.getAuthHeaders(),
    }
    await axios
      .post(
        `${Env.get('BIGBUY_API_URL')}/rest/order/create.json`,
        {
          order: {
            internalReference,
            language: 'es',
            paymentMethod: 'moneybox',
            carriers: [
              {
                name: 'correos',
              },
              {
                name: 'chrono',
              },
              {
                name: 'gls',
              },
              {
                name: 'ups',
              },
              {
                name: 'dhl',
              },
              {
                name: 'tnt',
              },
              {
                name: 'seur',
              },
              {
                name: 'correos international',
              },
            ],
            shippingAddress: {
              firstName: shipping.firstName,
              lastName: shipping.lastName,
              country: getCountryCode(shipping.country),
              postcode: shipping.postalCode,
              town: shipping.locality,
              address: `${shipping.addressLine1}${
                shipping.addressLine2 ? ` ${shipping.addressLine2}` : ''
              }`,
              phone: '644348466',
              email: email,
              comment: '',
            },
            products: products,
          },
        },
        options
      )
      .then(async (response: AxiosResponse) => {
        if (response.status === 201) {
          orderId = response.data.order_id
        } else {
          throw new Error('Something went wrong')
        }
      })
      .catch((error) => {
        throw new InternalServerException(error.message)
      })
    return orderId
  }

  private static getAuthHeaders() {
    return {
      Authorization: `Bearer ${Env.get('BIGBUY_API_KEY')}`,
    }
  }
}
