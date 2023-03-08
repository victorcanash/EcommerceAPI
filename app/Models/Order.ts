import { column, computed } from '@ioc:Adonis/Lucid/Orm'

import AppBaseModel from 'App/Models/AppBaseModel'
import ProductInventory from 'App/Models/ProductInventory'
import ProductPack from 'App/Models/ProductPack'
import BigbuyService from 'App/Services/BigbuyService'
import BraintreeService from 'App/Services/BraintreeService'
import PaypalService from 'App/Services/PaypalService'
import { OrderBigbuy, OrderTransaction } from 'App/Types/order'
import { GuestCartItem, GuestCartCheckItem } from 'App/Types/cart'
import { getCountryName } from 'App/Utils/addresses'

export default class Order extends AppBaseModel {
  @column()
  public userId?: number

  @column()
  public guestUserId?: number

  @column()
  public braintreeTransactionId?: string

  @column()
  public paypalTransactionId?: string

  @column()
  public bigbuyId?: string

  @column({
    prepare: (value: GuestCartItem[]) => JSON.stringify(value),
  })
  public products: GuestCartItem[]

  @computed()
  public get items() {
    return this.itemsData
  }

  public itemsData: GuestCartCheckItem[] = []

  @computed()
  public get bigbuy() {
    return this.bigbuyData
  }

  public bigbuyData: OrderBigbuy | undefined

  @computed()
  public get transaction() {
    return this.transactionData
  }

  public transactionData: OrderTransaction | undefined

  public async loadItemsData() {
    if (this.products.length > 0) {
      const inventories = await ProductInventory.query().whereIn(
        'id',
        this.products.map((item) => {
          return item.inventoryId || -1
        })
      )
      const packs = await ProductPack.query().whereIn(
        'id',
        this.products.map((item) => {
          return item.packId || -1
        })
      )
      for (let i = 0; i < this.products.length; i++) {
        const product = this.products[i]
        if (product.inventoryId) {
          const inventory = inventories.find((item) => item.id === product.inventoryId)
          if (inventory) {
            this.itemsData.push({
              inventory: inventory,
              quantity: product.quantity,
            })
          }
        } else if (product.packId) {
          const pack = packs.find((item) => item.id === product.packId)
          if (pack) {
            this.itemsData.push({
              pack: pack,
              quantity: product.quantity,
            })
          }
        }
      }
    }
  }

  public async loadBigbuyData() {
    if (this.bigbuyId) {
      this.bigbuyData = await BigbuyService.getOrderInfo(this.bigbuyId)
    }
  }

  public async loadPaymentData() {
    if (this.braintreeTransactionId || this.paypalTransactionId) {
      if (this.braintreeTransactionId) {
        const transactionInfo = await new BraintreeService().getTransactionInfo(
          this.braintreeTransactionId
        )
        this.transactionData = {
          amount: transactionInfo?.amount || '',
          billing: {
            firstName: transactionInfo?.billing?.firstName || '',
            lastName: transactionInfo?.billing?.lastName || '',
            country: transactionInfo?.billing?.countryName || '',
            postalCode: transactionInfo?.billing?.postalCode || '',
            locality: transactionInfo?.billing?.locality || '',
            addressLine1: transactionInfo?.billing?.streetAddress || '',
            addressLine2: transactionInfo?.billing?.extendedAddress || '',
          },
          creditCard: {
            cardType: transactionInfo?.creditCard?.cardType || '',
            last4: transactionInfo?.creditCard?.last4 || '',
          },
          paypalAccount: {
            payerEmail: transactionInfo?.paypalAccount?.payerEmail || '',
          },
        }
      } else if (this.paypalTransactionId) {
        const transactionInfo = await PaypalService.getOrderInfo(this.paypalTransactionId)
        this.transactionData = {
          amount: transactionInfo?.purchase_units[0]?.amount?.value || '',
          billing: {
            firstName: transactionInfo?.payment_source?.card?.name || '',
            lastName: '',
            country: getCountryName(
              transactionInfo?.payment_source?.card?.billing_address?.country_code || ''
            ),
            postalCode: transactionInfo?.payment_source?.card?.billing_address?.postal_code || '',
            locality: transactionInfo?.payment_source?.card?.billing_address?.admin_area_1 || '',
            addressLine1:
              transactionInfo?.payment_source?.card?.billing_address?.address_line_1 || '',
            addressLine2:
              transactionInfo?.payment_source?.card?.billing_address?.address_line_2 || '',
          },
          creditCard: {
            cardType: transactionInfo?.payment_source?.card?.brand || '',
            last4: transactionInfo?.payment_source?.card?.last_digits || '',
          },
          paypalAccount: {
            payerEmail: transactionInfo?.payment_source?.paypal?.email_address || '',
          },
        }
      }
    }
  }
}
