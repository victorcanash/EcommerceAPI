import User from 'App/Models/User'
import UserAddress from 'App/Models/UserAddress'
import Cart from 'App/Models/Cart'
import CartItem from 'App/Models/CartItem'
import Product from 'App/Models/Product'
import ProductCategory from 'App/Models/ProductCategory'
import ProductDiscount from 'App/Models/ProductDiscount'
import ProductInventory from 'App/Models/ProductInventory'
import ProductPack from 'App/Models/ProductPack'
import Order from 'App/Models/Order'
import { PaymentModes } from 'App/Constants/payment'
import { GuestCartCheck, GuestCartCheckItem } from 'App/Types/cart'
import { GuestUserCheckout } from 'App/Types/user'

/**
 * Basic JSON response for Controllers
 */
export type BasicResponse = {
  code: number
  message: string
}

/**
 * Init Auth JSON response for Controllers
 */
export type InitAuthResponse = {
  code: number
  message: string
  categories: ProductCategory[]
  products: Product[]
  packs: ProductPack[]
  user?: User
  paymentMode: PaymentModes
  currency: string
  braintreeToken?: string
  paypalMerchantId?: string
  paypalClientId?: string
  paypalToken?: string
  guestCart?: GuestCartCheck
}

/**
 * Auth JSON response for Controllers
 */
export type AuthResponse = {
  code: number
  message: string
  token: string
  user: User
  braintreeToken?: string
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
  braintreeToken?: string
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
  cart: Cart | GuestCartCheck
  changedItemsByInventory: CartItem[] | GuestCartCheckItem[]
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
 * Product pack JSON response for Controllers
 */
export type PPackResponse = {
  code: number
  message: string
  productPack: ProductPack
}

/**
 * Product packs JSON response for Controllers
 */
export type PPacksResponse = {
  code: number
  message: string
  productPacks: ProductPack[]
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
 * Guest User Data JSON response for Controllers
 */
export type GuestUserDataResponse = {
  code: number
  message: string
  guestUser: GuestUserCheckout
  guestCart: GuestCartCheck
  checkoutPayment: any
}

/**
 * Braintree Token JSON response for Controllers
 */
export type BraintreeTokenResponse = {
  code: number
  message: string
  braintreeToken?: string
}

/**
 * Paypal User Token JSON response for Controllers
 */
export type PaypalUserTokenResponse = {
  code: number
  message: string
  paypalUserToken: string
}

/**
 * Paypal Create Order JSON response for Controllers
 */
export type PaypalCreateOrderResponse = {
  code: number
  message: string
  paypalOrderId: string
}
