import Env from '@ioc:Adonis/Core/Env'

import braintree, { BraintreeGateway, KeyGatewayConfig } from 'braintree'

import User from 'App/Models/User'
import { GuestUserCheckout } from 'App/Types/user'
import PermissionException from 'App/Exceptions/PermissionException'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'
import InternalServerException from 'App/Exceptions/InternalServerException'
import { PaymentModes } from 'App/Constants/payment'

export default class BraintreeService {
  private gateway: BraintreeGateway

  constructor() {
    if (Env.get('PAYMENT_MODE', PaymentModes.BRAINTREE) === PaymentModes.BRAINTREE) {
      let braintreeEnvironment = braintree.Environment.Sandbox
      if (Env.get('BRAINTREE_ENV', 'sandbox') === 'production') {
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
    let clientToken: string | undefined
    if (Env.get('PAYMENT_MODE', PaymentModes.BRAINTREE) === PaymentModes.BRAINTREE) {
      const customer = braintreeId ? await this.getCustomer(braintreeId) : undefined
      let customerId = customer?.id || undefined
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
    }
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
    user: User | GuestUserCheckout,
    amount: string,
    braintreeCustomer?: braintree.Customer
  ) {
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
        amount: amount,
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
