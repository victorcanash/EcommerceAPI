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
  Route.get('/', async () => {
    return { hello: 'Welcome to Ecommerce API made by Victor Canas' }
  })

  Route.post('/register', 'UsersController.store')
  Route.post('/login', 'AuthController.login')
  Route.post('/logout', 'AuthController.logout').middleware('auth:api')

  Route.resource('/users', 'UsersController')
    .except(['store'])
    .middleware({
      index: ['auth:api', 'admin'],
      show: ['auth:api'],
      update: ['auth:api'],
      destroy: ['auth:api'],
    })
    .apiOnly()

  Route.resource('/uaddresses', 'UAddressesController')
    .middleware({
      index: ['auth:api', 'admin'],
      show: ['auth:api'],
      store: ['auth:api'],
      update: ['auth:api'],
      destroy: ['auth:api'],
    })
    .apiOnly()

  Route.resource('/upayments', 'UPaymentsController')
    .middleware({
      index: ['auth:api', 'admin'],
      show: ['auth:api'],
      store: ['auth:api'],
      update: ['auth:api'],
      destroy: ['auth:api'],
    })
    .apiOnly()

  Route.resource('/products', 'ProductsController')
    .middleware({
      store: ['auth:api', 'admin'],
      update: ['auth:api', 'admin'],
      destroy: ['auth:api', 'admin'],
    })
    .apiOnly()

  Route.resource('/pcategories', 'PCategoriesController')
    .middleware({
      store: ['auth:api', 'admin'],
      update: ['auth:api', 'admin'],
      destroy: ['auth:api', 'admin'],
    })
    .apiOnly()

  Route.resource('/pdiscounts', 'PDiscountsController')
    .middleware({
      store: ['auth:api', 'admin'],
      update: ['auth:api', 'admin'],
      destroy: ['auth:api', 'admin'],
    })
    .apiOnly()

  Route.resource('/pinventories', 'PInventoriesController')
    .middleware({
      store: ['auth:api', 'admin'],
      update: ['auth:api', 'admin'],
      destroy: ['auth:api', 'admin'],
    })
    .apiOnly()
}).prefix('/api')
