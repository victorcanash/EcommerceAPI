import Env from '@ioc:Adonis/Core/Env'
import { I18nContract } from '@ioc:Adonis/Addons/I18n'

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { qs } from 'url-parse'
import { v4 as uuidv4 } from 'uuid'

import Cart from 'App/Models/Cart'
import CartItem from 'App/Models/CartItem'
import User from 'App/Models/User'
import { OrderPaypalProduct } from 'App/Types/order'
import { CheckoutData } from 'App/Types/checkout'
import { GuestCartCheck, GuestCartCheckItem } from 'App/Types/cart'
import CartsService from 'App/Services/CartsService'
import { getCountryCode } from 'App/Utils/addresses'
import InternalServerException from 'App/Exceptions/InternalServerException'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'
import PermissionException from 'App/Exceptions/PermissionException'

export default class PaypalService {
  private static get baseUrl() {
    if (Env.get('PAYPAL_ENV', 'sandbox') === 'production') {
      return 'https://api-m.paypal.com'
    }
    return 'https://api-m.sandbox.paypal.com'
  }

  private static async generateAccessToken(i18n?: I18nContract) {
    let accessToken = ''
    const options: AxiosRequestConfig = {
      headers: {
        'Accept': 'application/json',
        'Accept-Language': i18n ? i18n.locale : 'es',
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

  public static async generateUserToken(i18n: I18nContract, paypalId?: string) {
    let userToken = ''
    const options: AxiosRequestConfig = {
      headers: {
        'Accept': 'application/json',
        'Accept-Language': i18n.locale,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      auth: {
        username: Env.get('PAYPAL_CLIENT_ID'),
        password: Env.get('PAYPAL_SECRET_KEY'),
      },
    }
    const body = qs.stringify({
      grant_type: 'client_credentials',
      response_type: 'id_token',
      target_customer_id: paypalId,
    })
    await axios
      .post(`${this.baseUrl}/v1/oauth2/token`, body, options)
      .then(async (response: AxiosResponse) => {
        if (response.status === 200 && response.data?.id_token) {
          userToken = response.data.id_token
        } else {
          throw new InternalServerException('Something went wrong, empty paypal user token')
        }
      })
      .catch((error) => {
        throw new InternalServerException(`Error generating paypal user token: ${error.message}`)
      })
    return userToken
  }

  private static async getAuthHeaders(i18n?: I18nContract) {
    const accessToken = await this.generateAccessToken(i18n)
    return {
      Authorization: `Bearer ${accessToken}`,
    }
  }

  public static async generateClientToken(i18n: I18nContract) {
    let clientToken: string | undefined
    const authHeaders = await this.getAuthHeaders(i18n)
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
        throw new InternalServerException(`Error generating paypal client token: ${error.message}`)
      })
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

  public static async createOrderProducts(
    currency: string,
    cart: Cart | GuestCartCheck,
    itemsAmount: {
      itemVat: number
      itemSubtotal: number
      itemTotal: number
    }[]
  ) {
    const orderProducts: OrderPaypalProduct[] = []
    cart.items.forEach((item: CartItem | GuestCartCheckItem, index: number) => {
      orderProducts.push({
        name: item.inventory ? item.inventory.name.current : item.pack?.name.current || '',
        description: item.inventory
          ? item.inventory.description.current
          : item.pack?.description.current || '',
        category: 'PHYSICAL_GOODS',
        quantity: item.quantity.toString(),
        unit_amount: {
          currency_code: currency,
          value: itemsAmount[index].itemSubtotal.toString(),
        },
        tax: {
          currency_code: currency,
          value: itemsAmount[index].itemVat.toString(),
        },
      } as OrderPaypalProduct)
    })
    return orderProducts
  }

  public static async createOrder(
    i18n: I18nContract,
    checkoutData: CheckoutData,
    cart: Cart | GuestCartCheck,
    user: User | undefined
  ) {
    let orderId = ''
    const currency = Env.get('CURRENCY', 'EUR')
    const { itemsAmount, totalDiscount, totalVat, subtotal, total } = CartsService.getTotalAmount(
      cart,
      user
    )
    if (subtotal <= 0) {
      throw new PermissionException(`Your don't have cart amount`)
    }
    const orderProducts = await PaypalService.createOrderProducts(currency, cart, itemsAmount)
    const authHeaders = await this.getAuthHeaders(i18n)
    const options: AxiosRequestConfig = {
      headers: {
        ...authHeaders,
        'Accept-Language': i18n.locale,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        'Paypal-Request-Id': uuidv4(),
      },
    }
    const body = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          items: orderProducts,
          amount: {
            currency_code: currency,
            value: total.toString(),
            breakdown: {
              item_total: {
                currency_code: currency,
                value: subtotal.toString(),
              },
              tax_total: {
                currency_code: currency,
                value: totalVat.toString(),
              },
              discount: {
                currency_code: currency,
                value: totalDiscount.toString(),
              },
              shipping: {
                currency_code: currency,
                value: '0',
              },
            },
          },
          payee: {
            email_address: Env.get('SMTP_EMAIL'),
            merchant_id: Env.get('PAYPAL_MERCHANT_ID'),
          },
          shipping: {
            address: {
              address_line_1: checkoutData.shipping.addressLine1,
              address_line_2: checkoutData.shipping.addressLine2,
              admin_area_1: checkoutData.shipping.locality,
              admin_area_2: checkoutData.shipping.locality,
              postal_code: checkoutData.shipping.postalCode,
              country_code: getCountryCode(checkoutData.shipping.country),
            },
            email_address: checkoutData.email,
            name: {
              full_name: `${checkoutData.shipping.firstName} ${checkoutData.shipping.lastName}`,
            },
            type: 'SHIPPING',
          },
        },
      ],
      payment_source: {
        paypal: {
          address: {
            address_line_1: checkoutData.billing.addressLine1,
            address_line_2: checkoutData.billing.addressLine2,
            admin_area_1: checkoutData.billing.locality,
            admin_area_2: checkoutData.billing.locality,
            postal_code: checkoutData.billing.postalCode,
            country_code: getCountryCode(checkoutData.billing.country),
          },
          email_address: checkoutData.email,
          name: {
            given_name: checkoutData.billing.firstName,
            surname: checkoutData.billing.lastName,
          },
          //birth_date: (user as User)?.birthday,
        },
      },
    }

    await axios
      .post(`${this.baseUrl}/v2/checkout/orders`, body, options)
      .then(async (response: AxiosResponse) => {
        if ((response.status === 200 || response.status === 201) && response.data?.id) {
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

  public static async captureOrder(i18n: I18nContract, orderId: string) {
    let transactionId = ''
    let customerId = ''
    const authHeaders = await this.getAuthHeaders(i18n)
    const options: AxiosRequestConfig = {
      headers: {
        ...authHeaders,
        'Accept-Language': i18n.locale,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        'Paypal-Request-Id': uuidv4(),
      },
    }
    await axios
      .post(`${this.baseUrl}/v2/checkout/orders/${orderId}/capture`, undefined, options)
      .then(async (response: AxiosResponse) => {
        if (
          response.status === 201 &&
          response.data?.id &&
          response.data.purchase_units &&
          response.data.purchase_units.length > 0 &&
          response.data.purchase_units[0].payments?.captures &&
          response.data.purchase_units[0].payments.captures.length > 0
        ) {
          const cardStatus = response.data.purchase_units[0].payments.captures[0].status
          const cardResponseCode =
            response.data.purchase_units[0].payments.captures[0].processor_response?.response_code
          if (cardStatus !== 'COMPLETED' || (cardResponseCode && cardResponseCode !== '0000')) {
            throw new InternalServerException('This card transaction cannot be processed')
          }
          transactionId = response.data.id
          customerId =
            response.data.payment_source?.card?.attributes?.vault?.customer?.id ||
            response.data.payment_source?.paypal?.attributes?.vault?.customer?.id ||
            ''
        } else {
          throw new InternalServerException('Something went wrong, empty paypal order id')
        }
      })
      .catch((error) => {
        throw new InternalServerException(`Error capturing paypal order: ${error.message}`)
      })
    return {
      transactionId,
      customerId,
    }
  }
}
