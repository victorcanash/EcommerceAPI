import User from 'App/Models/User'
import Cart from 'App/Models/Cart'
import CartItem from 'App/Models/CartItem'
import Landing from 'App/Models/Landing'
import Product from 'App/Models/Product'
import ProductCategory from 'App/Models/ProductCategory'
import ProductDiscount from 'App/Models/ProductDiscount'
import ProductInventory from 'App/Models/ProductInventory'
import ProductPack from 'App/Models/ProductPack'
import ProductReview from 'App/Models/ProductReview'
import Order from 'App/Models/Order'
import { GuestCartCheck, GuestCartCheckItem } from 'App/Types/cart'

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
  landings: Landing[]
  user?: User
  guestCart?: GuestCartCheck
  paypal?: {
    merchantId?: string
    clientId?: string
    token?: string
    advancedCards?: boolean
  }
  google: {
    oauthId: string
  }
}

/**
 * Auth JSON response for Controllers
 */
export type AuthResponse = {
  code: number
  message: string
  token: string
  user: User
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
 * Check Cart JSON response for Controllers
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
 * Landing JSON response for Controllers
 */
export type LandingResponse = {
  code: number
  message: string
  landing: Landing
}

/**
 * Landings JSON response for Controllers
 */
export type LandingsResponse = {
  code: number
  message: string
  landings: Landing[]
  totalPages: number
  currentPage: number
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
 * Create Product review JSON response for Controllers
 */
export type CreatePReviewResponse = {
  code: number
  message: string
  productReview: ProductReview
  productRating: {
    rating: string
    reviewsCount: number
  }
}

/**
 * Product review JSON response for Controllers
 */
export type PReviewResponse = {
  code: number
  message: string
  productReview: ProductReview
}

/**
 * Product reviews JSON response for Controllers
 */
export type PReviewsResponse = {
  code: number
  message: string
  productReviews: ProductReview[]
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
export type PaypalTransactionResponse = {
  code: number
  message: string
  paypalTransactionId: string
}

/**
 * Google API Indexer JSON response for Controllers
 */
export type GoogleAPIIndexerResponse = {
  code: number
  message: string
  result: any
}
