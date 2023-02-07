import ProductInventory from 'App/Models/ProductInventory'

export type GuestCart = {
  items: GuestCartItem[]
}

export type GuestCartItem = {
  inventoryId: number
  quantity: number
}

export type GuestCartCheck = {
  items: GuestCartCheckItem[]
}

export type GuestCartCheckItem = {
  inventory: ProductInventory
  quantity: number
}
