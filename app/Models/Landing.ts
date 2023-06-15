import { column, hasMany, HasMany, ModelQueryBuilderContract, scope } from '@ioc:Adonis/Lucid/Orm'

import TextsBaseModel from 'App/Models/TextsBaseModel'
import Product from 'App/Models/Product'
import ProductPack from 'App/Models/ProductPack'

export default class Landing extends TextsBaseModel {
  @column()
  public slug: string

  @column({
    prepare: (value: string[]) => JSON.stringify(value),
    consume: (value: string) => value as unknown as string[],
  })
  public images: string[]

  @column({
    prepare: (value: string[]) => JSON.stringify(value),
    consume: (value: string) => value as unknown as string[],
  })
  public tutorialSources: string[]

  @hasMany(() => Product, {
    onQuery: (query) => {
      query.orderBy('id', 'asc')
    },
  })
  public products: HasMany<typeof Product>

  @hasMany(() => ProductPack, {
    onQuery: (query) => {
      query.orderBy('id', 'asc')
    },
  })
  public packs: HasMany<typeof ProductPack>

  public static getProductsData = scope(
    (query: ModelQueryBuilderContract<typeof Landing, Landing>) => {
      query.preload('products', (query) => {
        query.apply((scopes) => {
          scopes.getInventoriesData()
        })
      })
      query.preload('packs')
    }
  )
}
