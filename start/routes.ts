/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.get('', async () => {
    return { hello: 'Welcome to Ecommerce API made by Victor Canas' }
  })

  // User routes

  Route.post('register', 'UsersController.store')
  Route.put('activate', 'AuthController.activate').middleware('auth:activation')
  Route.post('login', 'AuthController.login')
  Route.post('logout', 'AuthController.logout').middleware('auth:api')
  Route.get('auth', 'AuthController.getLogged').middleware('auth:api')
  Route.get('auth/admin', 'AuthController.isAdmin').middleware('auth:api')
  Route.put('auth/:id', 'AuthController.update')

  Route.post('auth/send-email/activation', 'AuthController.sendActivationEmail')
  Route.post('auth/send-email/reset', 'AuthController.sendResetPswEmail')
  Route.post('auth/send-email/update', 'AuthController.sendUpdateEmail').middleware('auth:api')

  Route.resource('users', 'UsersController')
    .except(['store'])
    .middleware({
      '*': ['auth:api'],
      'index': ['admin'],
      'show': ['admin'],
    })
    .apiOnly()
  Route.put('users/:id/addresses', 'UsersController.updateAddresses').middleware('auth:api')

  /*
  Route.resource('user-addresses', 'UAddressesController')
    .middleware({
      '*': ['auth:api', 'admin'],
    })
    .apiOnly()
  */

  // Cart routes

  Route.put('carts/:id/check', 'CartsController.check').middleware('auth:api')

  Route.resource('cart-items', 'CItemsController')
    .except(['index', 'show'])
    .middleware({
      '*': ['auth:api'],
    })
    .apiOnly()

  // Product routes

  Route.resource('products', 'ProductsController')
    .middleware({
      store: ['auth:api', 'admin'],
      update: ['auth:api', 'admin'],
      destroy: ['auth:api', 'admin'],
    })
    .apiOnly()

  Route.resource('products.images', 'PImagesController')
    .except(['index', 'update'])
    .middleware({
      store: ['auth:api', 'admin'],
      destroy: ['auth:api', 'admin'],
    })
    .apiOnly()

  Route.resource('product-categories', 'PCategoriesController')
    .except(['show'])
    .middleware({
      store: ['auth:api', 'admin'],
      update: ['auth:api', 'admin'],
      destroy: ['auth:api', 'admin'],
    })
    .apiOnly()

  Route.resource('product-discounts', 'PDiscountsController')
    .except(['index', 'show'])
    .middleware({
      '*': ['auth:api', 'admin'],
    })
    .apiOnly()

  Route.resource('product-inventories', 'PInventoriesController')
    .except(['index', 'show'])
    .middleware({
      '*': ['auth:api', 'admin'],
    })
    .apiOnly()

  // Payment routes

  Route.post('payments/transaction', 'PaymentsController.createTransaction').middleware('auth:api')

  /*Route.post('stripe/checkout-session', 'StripeController.createCheckoutSession').middleware(
    'auth:api'
  )
  Route.post('stripe/webhooks', 'StripeController.webhooks')*/
}).prefix('api')
