import Route from '@ioc:Adonis/Core/Route'

const welcomeResponse = { hello: 'Welcome to Ecommerce API made by Victor Canas' }

Route.get('', async () => {
  return welcomeResponse
})
Route.group(() => {
  Route.get('', async () => {
    return welcomeResponse
  })

  // User routes

  Route.post('auth/init', 'AuthController.init')
  Route.post('auth/register', 'UsersController.store')
  Route.put('auth/activate', 'AuthController.activate').middleware('auth:activation')
  Route.post('auth/login', 'AuthController.login')
  Route.post('auth/login/google', 'AuthController.loginGoogle')
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
  Route.post('users/send-email/contact', 'UsersController.sendContactEmail')

  // Cart routes

  Route.put('carts/:id/check', 'CartsController.check')

  Route.resource('cart-items', 'CItemsController')
    .except(['index', 'show'])
    .middleware({
      '*': ['auth:api'],
    })
    .apiOnly()

  // Product routes

  Route.resource('landings', 'LandingsController')
    .except(['show', 'update', 'destroy'])
    .middleware({
      '*': ['auth:api', 'admin'],
    })
    .apiOnly()

  Route.resource('product-categories', 'PCategoriesController')
    .except(['index', 'show'])
    .middleware({
      '*': ['auth:api', 'admin'],
    })
    .apiOnly()

  Route.resource('products', 'ProductsController')
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

  Route.resource('product-reviews', 'PReviewsController')
    .except(['show'])
    .middleware({
      update: ['auth:api', 'admin'],
      destroy: ['auth:api', 'admin'],
    })
    .apiOnly()

  // Payment routes

  Route.post('payments/paypal-user-token', 'PaymentsController.getPaypalUserToken').middleware(
    'auth:api'
  )
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
  Route.post(
    'orders/send-email/breakdown/:id',
    'OrdersController.sendOrderBreakdownEmail'
  ).middleware(['auth:api', 'admin'])

  // Google API routes

  Route.post('google/indexer', 'GoogleController.updateGoogleIndexer').middleware([
    'auth:api',
    'admin',
  ])
}).prefix('api')
