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

Route.get('', async () => {
  return { hello: 'Welcome to Ecommerce API made by Victor Canas' }
})
Route.group(() => {
  Route.get('', async () => {
    return { hello: 'Welcome to Ecommerce API made by Victor Canas' }
  })

  // User routes

  Route.post('auth/init', 'AuthController.init')
  Route.post('auth/register', 'UsersController.store')
  Route.put('auth/activate', 'AuthController.activate').middleware('auth:activation')
  Route.post('auth/login', 'AuthController.login')
  Route.post('auth/logout', 'AuthController.logout').middleware('auth:api')
  Route.put('auth/:id', 'AuthController.update')
  Route.get('auth/admin', 'AuthController.isAdmin').middleware('auth:api')

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
  Route.post('users/send-email/contact', 'UsersController.sendContactEmail')

  /*
  Route.resource('user-addresses', 'UAddressesController')
    .middleware({
      '*': ['auth:api', 'admin'],
    })
    .apiOnly()
  */

  // Cart routes

  Route.put('carts/:id/check', 'CartsController.check')

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
    .except(['index', 'show'])
    .middleware({
      '*': ['auth:api', 'admin'],
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

  Route.resource('product-packs', 'PPacksController')
    .except(['show'])
    .middleware({
      '*': ['auth:api', 'admin'],
    })
    .apiOnly()

  // Payment routes
  Route.post('payments/paypal-user-token', 'PaymentsController.getPaypalUserToken').middleware(
    'auth:api'
  )
  Route.post('payments/send-email/transaction', 'PaymentsController.sendConfirmTransactionEmail')
  Route.get('payments/guest-user-data', 'PaymentsController.getGuestUserData').middleware(
    'auth:confirmation'
  )
  Route.post('payments/braintree-transaction', 'PaymentsController.createBraintreeTransaction')
  Route.post('payments/paypal-transaction', 'PaymentsController.createPaypalTransaction')
  Route.post('payments/paypal-transaction/:id', 'PaymentsController.capturePaypalTransaction')

  /*Route.post('stripe/checkout-session', 'StripeController.createCheckoutSession').middleware(
    'auth:api'
  )
  Route.post('stripe/webhooks', 'StripeController.webhooks')*/

  // Order routes
  Route.resource('orders', 'OrdersController')
    .except(['update', 'destroy'])
    .middleware({
      index: ['auth:api'],
      store: ['auth:api, admin'],
    })
    .apiOnly()
  Route.post('orders/:id/send-email/check', 'OrdersController.sendCheckEmail').middleware([
    'auth:api',
    'admin',
  ])
}).prefix('api')
