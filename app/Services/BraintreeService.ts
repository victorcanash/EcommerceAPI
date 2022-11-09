import Env from '@ioc:Adonis/Core/Env'

import braintree, { BraintreeGateway, KeyGatewayConfig, TransactionRequest } from 'braintree'

import InternalServerException from 'App/Exceptions/InternalServerException'

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

  public async generateClientToken(braintreeId: string) {
    const customer = await this.getCustomer(braintreeId)
    let customerId = customer?.id || ''
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

  public async createTransaction(request: TransactionRequest) {
    try {
      const transactionResponse = await this.gateway.transaction.sale(request)
      return transactionResponse
    } catch (error) {
      throw new InternalServerException(error.message)
    }
  }
}
