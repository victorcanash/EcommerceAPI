import ProductInventory from 'App/Models/ProductInventory'
import ProductPack from 'App/Models/ProductPack'

export type GuestCart = {
  items: GuestCartItem[]
}

export type GuestCartItem = {
  inventoryId?: number
  packId?: number
  quantity: number
}

export type GuestCartCheck = {
  items: GuestCartCheckItem[]
}

export type GuestCartCheckItem = {
  inventory?: ProductInventory
  pack?: ProductPack
  quantity: number
}

export type TotalAmount = {
  itemsAmount: ItemAmount[]
  subtotal: number
  totalVat: number
  totalDiscount: number
  total: number
  totalQuantity: number
}

export type ItemAmount = {
  itemVat: number
  itemSubtotal: number
  itemTotal: number
}
