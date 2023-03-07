import Env from '@ioc:Adonis/Core/Env'
import { I18nContract } from '@ioc:Adonis/Addons/I18n'

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { qs } from 'url-parse'

import Cart from 'App/Models/Cart'
import CartItem from 'App/Models/CartItem'
import { PaymentModes } from 'App/Constants/payment'
import { OrderPaypalProduct } from 'App/Types/order'
import { GuestUserCheckoutAddress } from 'App/Types/user'
import { GuestCartCheck, GuestCartCheckItem } from 'App/Types/cart'
import { getCountryCode } from 'App/Utils/addresses'
import InternalServerException from 'App/Exceptions/InternalServerException'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'

export default class PaypalService {
  private static get baseUrl() {
    if (Env.get('PAYPAL_ENV', 'sandbox') === 'production') {
      return 'https://api-m.paypal.com'
    }
    return 'https://api-m.sandbox.paypal.com'
  }

  private static async generateAccessToken() {
    let accessToken = ''
    const options: AxiosRequestConfig = {
      headers: {
        'Accept': 'application/json',
        //'Accept-Language': 'en_US',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      auth: {
        username: Env.get('PAYPAL_CLIENT_ID'),
        password: Env.get('PAYPAL_SECRET_KEY'),
      },
    }
    await axios
      .post(
        `${this.baseUrl}/v1/oauth2/token`,
        qs.stringify({ grant_type: 'client_credentials' }),
        options
      )
      .then(async (response: AxiosResponse) => {
        if (response.status === 200 && response.data?.access_token) {
          accessToken = response.data.access_token
        } else {
          throw new InternalServerException('Something went wrong, empty paypal access token')
        }
      })
      .catch((error) => {
        throw new InternalServerException(`Error generating paypal access token: ${error.message}`)
      })
    return accessToken
  }

  private static async getAuthHeaders() {
    const accessToken = await this.generateAccessToken()
    return {
      Authorization: `Bearer ${accessToken}`,
    }
  }

  public static async generateClientToken(i18n: I18nContract) {
    let clientToken: string | undefined
    if (Env.get('PAYMENT_MODE', PaymentModes.BRAINTREE) === PaymentModes.PAYPAL) {
      const authHeaders = await this.getAuthHeaders()
      const options: AxiosRequestConfig = {
        headers: {
          ...authHeaders,
          'Accept-Language': i18n.locale,
          'Content-Type': 'application/json',
        },
      }
      await axios
        .post(`${this.baseUrl}/v1/identity/generate-token`, undefined, options)
        .then(async (response: AxiosResponse) => {
          if (response.status === 200 && response.data?.client_token) {
            clientToken = response.data.client_token
          } else {
            throw new InternalServerException('Something went wrong, empty paypal client token')
          }
        })
        .catch((error) => {
          throw new InternalServerException(
            `Error generating paypal client token: ${error.message}`
          )
        })
    }
    return clientToken
  }

  public static async getOrderInfo(paypalTransactionId: string) {
    let result: any
    const authHeaders = await this.getAuthHeaders()
    const options: AxiosRequestConfig = {
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
    }
    await axios
      .get(`${this.baseUrl}/v2/checkout/orders/${paypalTransactionId}`, options)
      .then(async (response: AxiosResponse) => {
        if (response.status === 200 && response.data) {
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

  public static async createOrderProducts(cart: Cart | GuestCartCheck) {
    const cartItemIds = [] as number[]
    const orderProducts: OrderPaypalProduct[] = []
    const currency = Env.get('CURRENCY', 'EUR')
    cart.items.forEach((item: CartItem | GuestCartCheckItem) => {
      if (item.quantity > 0) {
        if (item.inventory) {
          if ((item as CartItem)?.id) {
            cartItemIds.push((item as CartItem).id)
          }
          orderProducts.push({
            name: item.inventory.product.name.current,
            description: item.inventory.name.current,
            category: 'PHYSICAL_GOODS',
            sku: item.inventory.sku,
            quantity: item.quantity.toString(),
            unit_amount: {
              currency_code: currency,
              value: item.inventory.realPrice.toString(),
            },
          } as OrderPaypalProduct)
        } else if (item.pack) {
          if ((item as CartItem)?.id) {
            cartItemIds.push((item as CartItem).id)
          }
          orderProducts.push({
            name: item.pack.name.current,
            description: item.pack.description.current,
            category: 'PHYSICAL_GOODS',
            quantity: item.quantity.toString(),
            unit_amount: {
              currency_code: currency,
              value: item.pack.price.toString(),
            },
          } as OrderPaypalProduct)
        }
      }
    })
    return {
      cartItemIds,
      orderProducts,
    }
  }

  public static async createOrder(
    shipping: GuestUserCheckoutAddress,
    products: OrderPaypalProduct[],
    amount: string
  ) {
    let orderId = ''
    const currency = Env.get('CURRENCY', 'EUR')
    const authHeaders = await this.getAuthHeaders()
    const options: AxiosRequestConfig = {
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
    }
    const body = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          items: products,
          amount: {
            currency_code: currency,
            value: amount,
            breakdown: {
              item_total: {
                currency_code: currency,
                value: amount,
              },
            },
          },
          payee: {
            email_address: Env.get('SMTP_EMAIL'),
            merchant_id: Env.get('PAYPAL_MERCHANT_ID'),
          },
          shipping: {
            address: {
              country_code: getCountryCode(shipping.country),
              address_line_1: shipping.addressLine1,
              address_line_2: shipping.addressLine2,
              admin_area_1: shipping.locality,
              admin_area_2: shipping.locality,
              postal_code: shipping.postalCode,
            },
            name: {
              full_name: `${shipping.firstName} ${shipping.lastName}`,
            },
            type: 'SHIPPING',
          },
        },
      ],
    }
    await axios
      .post(`${this.baseUrl}/v2/checkout/orders`, body, options)
      .then(async (response: AxiosResponse) => {
        if (response.status === 201 && response.data?.id) {
          orderId = response.data.id
        } else {
          throw new InternalServerException('Something went wrong, empty paypal order id')
        }
      })
      .catch((error) => {
        throw new InternalServerException(`Error creating paypal order: ${error.message}`)
      })
    return orderId
  }

  public static async captureOrder(orderId: string) {
    let transactionId = ''
    const authHeaders = await this.getAuthHeaders()
    const options: AxiosRequestConfig = {
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
    }
    await axios
      .post(`${this.baseUrl}/v2/checkout/orders/${orderId}/capture`, undefined, options)
      .then(async (response: AxiosResponse) => {
        if (response.status === 201 && response.data) {
          const errorDetail = Array.isArray(response.data.details) && response.data.details[0]
          if (errorDetail) {
            let errorMessage = 'Sorry, your transaction could not be processed.'
            if (errorDetail.description) errorMessage += '\n\n' + errorDetail.description
            if (response.data.debug_id) errorMessage += ' (' + response.data.debug_id + ')'
            throw new InternalServerException(errorMessage)
          }
          transactionId = response.data.id
        } else {
          throw new InternalServerException('Something went wrong, empty paypal order')
        }
      })
      .catch((error) => {
        throw new InternalServerException(`Error capturing paypal order: ${error.message}`)
      })
    return transactionId
  }
}
