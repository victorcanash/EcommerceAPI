import User from 'App/Models/User'
import UserAddress from 'App/Models/UserAddress'
import Product from 'App/Models/Product'
import ProductCategory from 'App/Models/ProductCategory'
import ProductDiscount from 'App/Models/ProductDiscount'
import ProductInventory from 'App/Models/ProductInventory'

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
 * User address JSON response for Controllers
 */
export type UAddressResponse = {
  code: number
  message: string
  userAddress: UserAddress
}

/**
 * User addresses JSON response for Controllers
 */
export type UAddressesResponse = {
  code: number
  message: string
  userAddresses: UserAddress[]
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
 * Product discounts JSON response for Controllers
 */
export type PDiscountsResponse = {
  code: number
  message: string
  productDiscounts: ProductDiscount[]
  totalPages: number
  currentPage: number
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
