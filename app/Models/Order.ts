import { column, computed } from '@ioc:Adonis/Lucid/Orm'

import AppBaseModel from 'App/Models/AppBaseModel'
import ProductInventory from 'App/Models/ProductInventory'
import ProductPack from 'App/Models/ProductPack'
import { OrderBigbuy, OrderTransaction } from 'App/Types/order'
import { GuestCartItem, GuestCartCheckItem } from 'App/Types/cart'
import BigbuyService from 'App/Services/BigbuyService'
import PaypalService from 'App/Services/PaypalService'
import { getCountryName } from 'App/Utils/addresses'

export default class Order extends AppBaseModel {
  @column()
  public userId?: number

  @column()
  public guestUserId?: number

  @column()
  public paypalTransactionId?: string

  @column()
  public bigbuyId?: string

  @column()
  public products: string

  @column()
  public notes: string

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
    let items: GuestCartItem[] = []
    try {
      items = JSON.parse(this.products) as GuestCartItem[]
    } catch (_error) {
      items = this.products as unknown as GuestCartItem[]
    }
    if (items.length > 0) {
      const inventories = await ProductInventory.query().whereIn(
        'id',
        items.map((item) => {
          return item.inventoryId || -1
        })
      )
      const packs = await ProductPack.query().whereIn(
        'id',
        items.map((item) => {
          return item.packId || -1
        })
      )
      for (let i = 0; i < items.length; i++) {
        const product = items[i]
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
    if (this.paypalTransactionId) {
      const transactionInfo = await PaypalService.getOrderInfo(this.paypalTransactionId)
      const amountInfo = transactionInfo?.purchase_units[0]?.amount
      this.transactionData = {
        amount: {
          currencyCode: amountInfo?.currency_code || '',
          value: amountInfo?.value || '',
          breakdown: {
            itemTotal: {
              currencyCode: amountInfo?.breakdown?.item_total?.currency_code || '',
              value: amountInfo?.breakdown?.item_total?.value || '',
            },
            taxTotal: {
              currencyCode: amountInfo?.breakdown?.tax_total?.currency_code || '',
              value: amountInfo?.breakdown?.tax_total?.value || '',
            },
            discount: {
              currencyCode: amountInfo?.breakdown?.discount?.currency_code || '',
              value: amountInfo?.breakdown?.discount?.value || '',
            },
            shipping: {
              currencyCode: amountInfo?.breakdown?.shipping?.currency_code || '',
              value: amountInfo?.breakdown?.shipping?.value || '',
            },
          },
        },
        billing: {
          firstName: transactionInfo?.payment_source?.card?.name || '',
          lastName: '',
          country: transactionInfo?.payment_source?.card?.billing_address?.country_code
            ? getCountryName(transactionInfo?.payment_source?.card?.billing_address?.country_code)
            : '',
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
