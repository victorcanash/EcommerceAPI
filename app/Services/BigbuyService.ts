// Primero obtenemos id producto
// GET https://api.sandbox.bigbuy.eu/rest/catalog/productinformationbysku/V1300179.json?isoCode=es
// conseguimos id del producto
// conseguir cantidad del inventario del producto
// GET https://api.sandbox.bigbuy.eu/rest/catalog/productstock/15647.json
import Env from '@ioc:Adonis/Core/Env'

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'
import InternalServerException from 'App/Exceptions/InternalServerException'
import User from 'App/Models/User'

export default class BigbuyService {
  public static async getProductInfo(sku: string) {
    const result = {
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
          result.id = response.data[0].id
          result.name = response.data[0].name
          result.description = response.data[0].description
        } else {
          throw new Error('Something went wrong')
        }
      })
      .catch((_error) => {
        throw new ModelNotFoundException(_error.message)
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
      .catch((_error) => {
        throw new ModelNotFoundException(
          `Invalid bigbuy id ${bigbuyId} getting bigbuy product quantity`
        )
      })
    return quantity
  }

  public static async checkOrder(user: User) {
    const result = {
      totalWithoutTaxesAndWithoutShippingCost: 0,
      totalWithoutTaxes: 0,
      total: 0,
    }
    const options: AxiosRequestConfig = {
      headers: this.getAuthHeaders(),
    }
    await axios
      .post(
        `${Env.get('BIGBUY_API_URL')}/rest/order/check.json`,
        {
          order: {
            internalReference: '',
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
              country: user.shipping.country,
              postcode: user.shipping.postalCode,
              town: user.shipping.locality,
              address: user.shipping.addressLine1,
              phone: '',
              email: user.email,
              comment: user.shipping.addressLine2,
            },
            products: user.cart.items.map((item) => {
              if (item.quantity > 0) {
                return {
                  reference: item.inventory.sku,
                  quantity: item.quantity,
                  internalReference: item.product.id,
                }
              }
            }),
          },
        },
        options
      )
      .then(async (response: AxiosResponse) => {
        if (response.status === 200) {
          result.total = response.data.total
          result.totalWithoutTaxes = response.data.totalWithoutTaxes
          result.totalWithoutTaxesAndWithoutShippingCost =
            response.data.totalWithoutTaxesAndWithoutShippingCost
        } else {
          throw new Error('Something went wrong')
        }
      })
      .catch((_error) => {
        throw new InternalServerException('Something went wrong')
      })
    return result
  }

  private static getAuthHeaders() {
    return {
      Authorization: `Bearer ${Env.get('BIGBUY_API_KEY')}`,
    }
  }
}
