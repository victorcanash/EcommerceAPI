import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Cart from 'App/Models/Cart'
import ProductInventory from 'App/Models/ProductInventory'
import UsersService from 'App/Services/UsersService'
import CartsService from 'App/Services/CartsService'
import BigbuyService from 'App/Services/BigbuyService'
import { GuestCartCheck, GuestCartCheckItem } from 'App/Types/cart'
import { CheckCartResponse } from 'App/Controllers/Http/types'
import CheckCartValidator from 'App/Validators/Cart/CheckCartValidator'
import { logRouteSuccess } from 'App/Utils/logger'

export default class CartsController {
  public async check({ params: { id }, request, response, auth, bouncer }: HttpContextContract) {
    let cart: Cart | GuestCartCheck | undefined

    const validToken = await auth.use('api').check()
    if (validToken) {
      cart = await CartsService.getCartById(id)

      await bouncer.with('CartPolicy').authorize('check', cart as Cart)

      cart = await (await UsersService.getUserById((cart as Cart).userId, true, true)).cart
    } else {
      const validatedCheckCartData = await request.validate(CheckCartValidator)

      let items = validatedCheckCartData.guestCart?.items
      if (items && items.length > 0) {
        const inventories = await ProductInventory.query().whereIn(
          'id',
          items.map((item) => {
            return item.inventoryId
          })
        )
        if (inventories.length > 0) {
          const stocks = await BigbuyService.getProductsStocks(
            inventories.map((inventory) => {
              return inventory.sku
            })
          )
          inventories.forEach((inventory) => {
            let stock = stocks.find((stock) => stock.sku === inventory.sku)
            inventory.bigbuyData.quantity = stock?.quantity || 0
          })
          const cartItems: GuestCartCheckItem[] = []
          items.forEach((item) => {
            let inventory = inventories.find((inventory) => inventory.id === item.inventoryId)
            if (inventory) {
              cartItems.push({
                inventory,
                quantity: item.quantity,
              })
            }
          })
          cart = {
            items: cartItems,
          }
        }
      }
    }

    let changedItemsByInventory = [] as GuestCartCheckItem[]
    if (cart) {
      changedItemsByInventory = await CartsService.checkCartItemsQuantity(cart)
    } else {
      cart = { items: [] } as GuestCartCheck
    }

    let successMsg = 'Successfully checked cart'
    if (validToken) {
      successMsg += ` by id ${id}`
    }
    logRouteSuccess(request, successMsg)
    return response.created({
      code: 201,
      message: successMsg,
      cart,
      changedItemsByInventory,
    } as CheckCartResponse)
  }
}
