import User from 'App/Models/User'
import UserAddress from 'App/Models/UserAddress'
import Cart from 'App/Models/Cart'
import CartItem from 'App/Models/CartItem'
import Product from 'App/Models/Product'
import ProductCategory from 'App/Models/ProductCategory'
import ProductDiscount from 'App/Models/ProductDiscount'
import ProductInventory from 'App/Models/ProductInventory'
import Order from 'App/Models/Order'

/**
 * Basic JSON response for Controllers
 */
export type BasicResponse = {
  code: number
  message: string
}

/**
 * Auth JSON response for Controllers
 */
export type AuthResponse = {
  code: number
  message: string
  token: string
  user: User
  braintreeToken: string
}

/**
 * Check admin role JSON response for Controllers
 */
export type IsAdminResponse = {
  code: number
  message: string
  isAdmin: boolean
}

/**
 * User JSON response for Controllers
 */
export type UserResponse = {
  code: number
  message: string
  user: User
  braintreeToken: string
}

/**
 * Users JSON response for Controllers
 */
export type UsersResponse = {
  code: number
  message: string
  users: User[]
  totalPages: number
  currentPage: number
}

/**
 * User addresses JSON response for Controllers
 */
export type UAddressesResponse = {
  code: number
  message: string
  shipping: UserAddress
  billing: UserAddress
}

/**
 * User addresses JSON response for Controllers
 */
export type CheckCartResponse = {
  code: number
  message: string
  cart: Cart
  changedItemsByInventory: CartItem[]
}

/**
 * Cart item JSON response for Controllers
 */
export type CItemResponse = {
  code: number
  message: string
  cartItem: CartItem
}

/**
 * Product JSON response for Controllers
 */
export type ProductResponse = {
  code: number
  message: string
  product: Product
}

/**
 * Products JSON response for Controllers
 */
export type ProductsResponse = {
  code: number
  message: string
  products: Product[]
  category: ProductCategory | null
  totalPages: number
  currentPage: number
}

/**
 * Product images JSON response for Controllers
 */
export type PImagesResponse = {
  code: number
  message: string
  productImages: string[]
}

/**
 * Product category JSON response for Controllers
 */
export type PCategoryResponse = {
  code: number
  message: string
  productCategory: ProductCategory
}

/**
 * Product categories JSON response for Controllers
 */
export type PCategoriesResponse = {
  code: number
  message: string
  productCategories: ProductCategory[]
  totalPages: number
  currentPage: number
}

/**
 * Product discount JSON response for Controllers
 */
export type PDiscountResponse = {
  code: number
  message: string
  productDiscount: ProductDiscount
}

/**
 * Product inventory JSON response for Controllers
 */
export type PInventoryResponse = {
  code: number
  message: string
  productInventory: ProductInventory
}

/**
 * Product inventories JSON response for Controllers
 */
export type PInventoriesResponse = {
  code: number
  message: string
  productInventories: ProductInventory[]
  totalPages: number
  currentPage: number
}

/**
 * Order JSON response for Controllers
 */
export type OrderResponse = {
  code: number
  message: string
  order: Order
}

/**
 * Orders JSON response for Controllers
 */
export type OrdersResponse = {
  code: number
  message: string
  orders: Order[]
  totalPages: number
  currentPage: number
}

/**
 * Stripe JSON response for Controllers
 */
/*export type StripeResponse = {
  code: number
  message: string
  sessionId: string
}*/
