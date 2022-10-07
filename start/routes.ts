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

  Route.resource('uaddresses', 'UAddressesController')
    .middleware({
      '*': ['auth:api', 'admin'],
    })
    .apiOnly()

  Route.resource('upayments', 'UPaymentsController')
    .middleware({
      '*': ['auth:api', 'admin'],
    })
    .apiOnly()

  // Cart routes

  Route.resource('carts', 'CartsController')
    .middleware({
      '*': ['auth:api', 'admin'],
    })
    .apiOnly()

  Route.resource('citems', 'CItemsController')
    .middleware({
      '*': ['auth:api'],
      'index': ['admin'],
      'show': ['admin'],
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
  Route.get('products/admin', 'ProductsController.indexAdmin').middleware(['auth:api', 'admin'])
  Route.get('products/admin/:id', 'ProductsController.showAdmin').middleware(['auth:api', 'admin'])

  Route.resource('products.images', 'PImagesController')
    .except(['index', 'update'])
    .middleware({
      store: ['auth:api', 'admin'],
      destroy: ['auth:api', 'admin'],
    })
    .apiOnly()

  Route.resource('pcategories', 'PCategoriesController')
    .middleware({
      show: ['auth:api', 'admin'],
      store: ['auth:api', 'admin'],
      update: ['auth:api', 'admin'],
      destroy: ['auth:api', 'admin'],
    })
    .apiOnly()

  Route.resource('pdiscounts', 'PDiscountsController')
    .middleware({
      '*': ['auth:api', 'admin'],
    })
    .apiOnly()

  Route.resource('pinventories', 'PInventoriesController')
    .middleware({
      '*': ['auth:api', 'admin'],
    })
    .apiOnly()

  // Stripe routes

  Route.post('stripe/checkout-session', 'StripeController.createCheckoutSession').middleware(
    'auth:api'
  )
  Route.post('stripe/webhooks', 'StripeController.webhooks')
}).prefix('api')
