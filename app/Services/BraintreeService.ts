import Env from '@ioc:Adonis/Core/Env'

import braintree, { BraintreeGateway, KeyGatewayConfig } from 'braintree'

import User from 'App/Models/User'
import Cart from 'App/Models/Cart'
import CartsService from 'App/Services/CartsService'
import { GuestUser } from 'App/Types/user'
import { GuestCartCheck } from 'App/Types/cart'
import InternalServerException from 'App/Exceptions/InternalServerException'
import PermissionException from 'App/Exceptions/PermissionException'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'

export default class BraintreeService {
  private gateway: BraintreeGateway

  constructor() {
    let braintreeEnvironment = braintree.Environment.Sandbox
    if (Env.get('NODE_ENV') === 'production') {
      braintreeEnvironment = braintree.Environment.Production
    }
    const env: KeyGatewayConfig = {
      environment: braintreeEnvironment,
      merchantId: Env.get('BRAINTREE_MERCHANT_ID', ''),
      privateKey: Env.get('BRAINTREE_PRIVATE_KEY', ''),
      publicKey: Env.get('BRAINTREE_PUBLIC_KEY', ''),
    }
    this.gateway = new braintree.BraintreeGateway(env)
  }

  public async getCustomer(braintreeId: string) {
    let customer: braintree.Customer | undefined
    await this.gateway.customer
      .find(braintreeId)
      .then((result) => {
        customer = result
      })
      .catch((_error) => {
        customer = undefined
      })
    return customer
  }

  public async updateCustomer(braintreeId: string, user: User) {
    let response: braintree.ValidatedResponse<braintree.Customer> | undefined
    await this.gateway.customer
      .update(braintreeId, {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      })
      .then((result) => {
        response = result
      })
      .catch((_error) => {
        response = undefined
      })
    return response
  }

  public async generateClientToken(braintreeId?: string) {
    const customer = braintreeId ? await this.getCustomer(braintreeId) : undefined
    let customerId = customer?.id || undefined
    let clientToken = ''
    await this.gateway.clientToken
      .generate({
        customerId,
      })
      .then((result) => {
        if (result && result.clientToken) {
          clientToken = result.clientToken
        } else {
          throw new InternalServerException('Something went wrong, empty braintree client token')
        }
      })
      .catch((error) => {
        throw new InternalServerException(error.message)
      })
    return clientToken
  }

  public async getTransactionInfo(transactionId: string) {
    let result: braintree.Transaction | undefined
    await this.gateway.transaction
      .find(transactionId)
      .then((response) => {
        result = response
      })
      .catch((error) => {
        throw new ModelNotFoundException(error.message)
      })
    return result
  }

  public async createTransaction(
    paymentMethodNonce: string,
    user: User | GuestUser,
    braintreeCustomer?: braintree.Customer,
    guestCartCheck?: GuestCartCheck
  ) {
    let cart: Cart | GuestCartCheck | undefined
    if ((user as User)?.id) {
      cart = (user as User).cart
    } else {
      cart = guestCartCheck
    }

    if (!user.shipping) {
      throw new PermissionException(`You don't have an existing shipping address`)
    }
    if (!user.billing) {
      throw new PermissionException(`You don't have an existing billing address`)
    }
    if (!cart) {
      throw new PermissionException(`You don't have an existing cart`)
    }
    if (cart.items && cart.items.length <= 0) {
      throw new PermissionException(`You don't have selected items in your cart`)
    }

    const amount = CartsService.getAmount(cart)
    if (amount <= 0) {
      throw new PermissionException(`Your don't have cart amount`)
    }

    const customer = braintreeCustomer
      ? undefined
      : {
          firstName: (user as User)?.firstName || user.billing.firstName,
          lastName: (user as User)?.lastName || user.billing.lastName,
          // company: "Braintree",
          // phone: "312-555-1234",
          // fax: "312-555-12346",
          // website: "http://www.example.com",
          email: user.email,
        }
    const customerId = braintreeCustomer ? braintreeCustomer.id : undefined

    let transactionResponse: braintree.ValidatedResponse<braintree.Transaction>
    try {
      transactionResponse = await this.gateway.transaction.sale({
        amount: amount.toFixed(2),
        paymentMethodNonce: paymentMethodNonce,
        // deviceData: deviceDataFromTheClient,
        customerId,
        customer,
        billing: {
          firstName: user.billing.firstName,
          lastName: user.billing.lastName,
          // company: "Braintree",
          streetAddress: user.billing.addressLine1,
          extendedAddress: user.billing.addressLine2,
          locality: user.billing.locality,
          // region: "IL",
          postalCode: user.billing.postalCode,
          countryName: user.billing.country,
        },
        shipping: {
          firstName: user.shipping.firstName,
          lastName: user.shipping.lastName,
          // company: "Braintree",
          streetAddress: user.shipping.addressLine1,
          extendedAddress: user.shipping.addressLine2,
          locality: user.shipping.locality,
          // region: "IL",
          postalCode: user.shipping.postalCode,
          countryName: user.shipping.country,
        },
        options: {
          submitForSettlement: true,
          storeInVaultOnSuccess: true,
        },
      })
    } catch (error) {
      throw new InternalServerException(error.message)
    }
    if (!transactionResponse.success) {
      throw new PermissionException(transactionResponse.message)
    }
    return transactionResponse
  }
}
