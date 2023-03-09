import Env from '@ioc:Adonis/Core/Env'

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { v4 as uuidv4 } from 'uuid'

import Cart from 'App/Models/Cart'
import CartItem from 'App/Models/CartItem'
import { OrderBigbuy, OrderBigbuyProduct } from 'App/Types/order'
import { GuestCartCheck, GuestCartCheckItem } from 'App/Types/cart'
import { GuestUserCheckoutAddress } from 'App/Types/user'
import { getCountryName, getCountryCode } from 'App/Utils/addresses'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'
import InternalServerException from 'App/Exceptions/InternalServerException'

export default class BigbuyService {
  private static get baseUrl() {
    if (Env.get('BIGBUY_ENV', 'sandbox') === 'production') {
      return 'https://api.bigbuy.eu'
    }
    return 'https://api.sandbox.bigbuy.eu'
  }

  private static getAuthHeaders() {
    return {
      Authorization: `Bearer ${Env.get('BIGBUY_API_KEY')}`,
    }
  }

  /*public static async getProductInfo(sku: string) {
    let result = {
      id: '',
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
  }*/

  public static async getProductQuantity(bigbuyId: string) {
    let quantity = 0
    const options: AxiosRequestConfig = {
      headers: this.getAuthHeaders(),
    }
    await axios
      .get(`${this.baseUrl}/rest/catalog/productstock/${bigbuyId}.json`, options)
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

  public static async getProductsStocks(skus: string[]) {
    let stocks = [] as { sku: string; quantity: number }[]
    const options: AxiosRequestConfig = {
      headers: this.getAuthHeaders(),
    }
    await axios
      .post(
        `${this.baseUrl}/rest/catalog/productsstockbyreference.json`,
        {
          product_stock_request: {
            products: skus.map((sku) => {
              return { sku: sku }
            }),
          },
        },
        options
      )
      .then(async (response: AxiosResponse) => {
        if (response.status === 200) {
          if (response.data && response.data.length > 0) {
            response.data.forEach((productData) => {
              let quantity = 0
              if (productData.stocks && productData.stocks.length > 0) {
                productData.stocks.forEach((stock) => {
                  quantity += stock.quantity
                })
              }
              stocks.push({
                sku: productData.sku,
                quantity: quantity,
              })
            })
          } else {
            stocks = skus.map((sku) => {
              return { sku: sku, quantity: 0 }
            })
          }
        } else {
          throw new Error('Something went wrong')
        }
      })
      .catch((error) => {
        throw new ModelNotFoundException(error.message)
      })
    return stocks
  }

  public static async getOrderInfo(bigbuyId: string) {
    let result = {
      id: '',
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
      products: [],
    } as OrderBigbuy
    const options: AxiosRequestConfig = {
      headers: this.getAuthHeaders(),
    }
    await axios
      .get(`${this.baseUrl}/rest/order/${bigbuyId}.json`, options)
      .then(async (response: AxiosResponse) => {
        if (response.status === 200 && response.data) {
          result = {
            ...response.data,
            shippingAddress: {
              ...response.data?.shippingAddress,
              country: getCountryName(response.data?.shippingAddress.country || ''),
            },
          }
        } else {
          throw new Error('Something went wrong')
        }
      })
      .catch((error) => {
        throw new ModelNotFoundException(error.message)
      })
    return result
  }

  public static async createOrderProducts(cart: Cart | GuestCartCheck) {
    const cartItemIds = [] as number[]
    const orderProducts: OrderBigbuyProduct[] = []
    cart.items.forEach((item: CartItem | GuestCartCheckItem) => {
      if (item.quantity > 0) {
        if (item.inventory) {
          if ((item as CartItem)?.id) {
            cartItemIds.push((item as CartItem).id)
          }
          orderProducts.push({
            reference: item.inventory.sku,
            quantity: item.quantity,
            internalReference: `${item.inventory.id.toString()}-${uuidv4()}`,
          } as OrderBigbuyProduct)
        } else if (item.pack) {
          if ((item as CartItem)?.id) {
            cartItemIds.push((item as CartItem).id)
          }
          item.pack.inventories.forEach((itemInventory) => {
            orderProducts.push({
              reference: itemInventory.sku,
              quantity: item.quantity,
              internalReference: `${item.pack?.id.toString()}-${uuidv4()}`,
            } as OrderBigbuyProduct)
          })
        }
      }
    })
    return {
      cartItemIds,
      orderProducts,
    }
  }

  public static async createOrder(
    internalReference: string,
    email: string,
    shipping: GuestUserCheckoutAddress,
    products: OrderBigbuyProduct[]
  ) {
    let orderId = ''
    const options: AxiosRequestConfig = {
      headers: this.getAuthHeaders(),
    }
    await axios
      .post(
        `${this.baseUrl}/rest/order/create.json`,
        {
          order: {
            internalReference: `${internalReference}-${uuidv4()}`,
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
}
