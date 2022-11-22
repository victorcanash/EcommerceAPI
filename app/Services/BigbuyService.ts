import Env from '@ioc:Adonis/Core/Env'

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

import User from 'App/Models/User'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'
import InternalServerException from 'App/Exceptions/InternalServerException'
import PermissionException from 'App/Exceptions/PermissionException'
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

  public static async createOrder(user: User, internalReference: string) {
    if (!user.shipping) {
      throw new PermissionException(`You don't have an existing shipping address`)
    }
    if (!user.billing) {
      throw new PermissionException(`You don't have an existing billing address`)
    }
    if (!user.cart) {
      throw new PermissionException(`You don't have an existing cart`)
    }
    if (user.cart.items && user.cart.items.length <= 0) {
      throw new PermissionException(`You don't have selected items in your cart`)
    }

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
              firstName: user.shipping.firstName,
              lastName: user.shipping.lastName,
              country: getCountryCode(user.shipping.country),
              postcode: user.shipping.postalCode,
              town: user.shipping.locality,
              address: `${user.shipping.addressLine1} ${user.shipping.addressLine2}`,
              phone: '644348466',
              email: user.email,
              comment: '',
            },
            products: user.cart.items.map((item) => {
              if (item.quantity > 0) {
                return {
                  reference: item.inventory.sku,
                  quantity: item.quantity,
                  internalReference: item.inventory.id.toString(),
                }
              }
            }),
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
