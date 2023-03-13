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

  // Order routes

  Route.resource('orders', 'OrdersController')
    .except(['store', 'update', 'destroy'])
    .middleware({
      index: ['auth:api'],
    })
    .apiOnly()
  Route.post('orders/admin', 'OrdersController.storeAdmin').middleware(['auth:api', 'admin'])
  Route.post('orders/send-email/check/:id', 'OrdersController.sendCheckEmail').middleware([
    'auth:api',
    'admin',
  ])

  // Google API routes

  Route.post('googleAPI/indexer', 'GoogleAPIController.storeIndexer').middleware([
    'auth:api',
    'admin',
  ])
}).prefix('api')
