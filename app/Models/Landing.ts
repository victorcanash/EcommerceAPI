import {
  column,
  hasMany,
  HasMany,
  ModelQueryBuilderContract,
  beforeFetch,
} from '@ioc:Adonis/Lucid/Orm'

import TextsBaseModel from 'App/Models/TextsBaseModel'
import Product from 'App/Models/Product'
import ProductPack from 'App/Models/ProductPack'

export default class Landing extends TextsBaseModel {
  @column({
    prepare: (value: string[]) => JSON.stringify(value),
    consume: (value: string) => JSON.parse(value) as string[],
  })
  public images: string[]

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

  @beforeFetch()
  public static beforeFetch(query: ModelQueryBuilderContract<typeof Landing>) {
    query.preload('products', (query) => {
      query.apply((scopes) => {
        scopes.getInventoriesData()
      })
    })
    query.preload('packs')
  }
}
