import Env from '@ioc:Adonis/Core/Env'
import { I18nContract } from '@ioc:Adonis/Addons/I18n'

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { qs } from 'url-parse'

import User from 'App/Models/User'
import Cart from 'App/Models/Cart'
import CartItem from 'App/Models/CartItem'
import { PaymentModes } from 'App/Constants/payment'
import { OrderPaypalProduct } from 'App/Types/order'
import { GuestUserCheckout } from 'App/Types/user'
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
    if (Env.get('PAYMENT_MODE', PaymentModes.BRAINTREE) === PaymentModes.PAYPAL) {
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
    const orderProducts: OrderPaypalProduct[] = []
    const currency = Env.get('CURRENCY', 'EUR')
    cart.items.forEach((item: CartItem | GuestCartCheckItem) => {
      if (item.quantity > 0) {
        if (item.inventory) {
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
    return orderProducts
  }

  public static async createOrder(
    i18n: I18nContract,
    user: User | GuestUserCheckout,
    products: OrderPaypalProduct[],
    amount: string,
    remember?: boolean
  ) {
    const result = {
      orderId: '',
      paypalEmail: undefined as string | undefined,
    }
    const currency = Env.get('CURRENCY', 'EUR')
    const authHeaders = await this.getAuthHeaders(i18n)
    const options: AxiosRequestConfig = {
      headers: {
        ...authHeaders,
        'Accept-Language': i18n.locale,
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
              address_line_1: user.shipping.addressLine1,
              address_line_2: user.shipping.addressLine2,
              admin_area_1: user.shipping.locality,
              admin_area_2: user.shipping.locality,
              postal_code: user.shipping.postalCode,
              country_code: getCountryCode(user.shipping.country),
            },
            name: {
              full_name: `${user.shipping.firstName} ${user.shipping.lastName}`,
            },
            type: 'SHIPPING',
          },
        },
      ],
      payment_source: {
        card: {
          attributes: remember
            ? {
                customer: (user as User)?.paypalId
                  ? {
                      id: (user as User).paypalId,
                    }
                  : undefined,
                vault: {
                  store_in_vault: 'ON_SUCCESS',
                },
              }
            : undefined,
        },
        paypal: {
          attributes: remember
            ? {
                customer: (user as User)?.paypalId
                  ? {
                      id: (user as User).paypalId,
                    }
                  : undefined,
                vault: {
                  store_in_vault: 'ON_SUCCESS',
                  usage_type: 'MERCHANT',
                  customer_type: 'CONSUMER',
                },
              }
            : undefined,
        },
      },
    }
    await axios
      .post(`${this.baseUrl}/v2/checkout/orders`, body, options)
      .then(async (response: AxiosResponse) => {
        if (response.status === 201 && response.data?.id) {
          const cardAuth = response.data.payment_source?.card?.authentication_result
          if (
            cardAuth?.liability_shift === 'UNKNOWN' ||
            (cardAuth?.liability_shift === 'NO' &&
              cardAuth?.three_d_secure?.enrollment_status === 'Y')
          ) {
            throw new InternalServerException(
              '3dSecure error, the card authentication system is not available'
            )
          }
          result.orderId = response.data.id
          result.paypalEmail = response.data.payment_source?.paypal?.email_address
        } else {
          throw new InternalServerException('Something went wrong, empty paypal order id')
        }
      })
      .catch((error) => {
        throw new InternalServerException(`Error creating paypal order: ${error.message}`)
      })
    return result
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
          customerId =
            response.data.payment_source?.card?.attributes?.vault?.customer?.id ||
            response.data.payment_source?.paypal?.attributes?.vault?.customer?.id ||
            ''
        } else {
          throw new InternalServerException('Something went wrong, empty paypal order')
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
