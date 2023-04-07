import { ApplicationContract } from '@ioc:Adonis/Core/Application'

import NP from 'number-precision'

export default class AppProvider {
  constructor(protected app: ApplicationContract) {}

  public register() {
    // Register your own bindings
  }

  public async boot() {
    // IoC container is ready
    NP.enableBoundaryChecking(false)
  }

  public async ready() {
    // App is ready
  }

  public async shutdown() {
    // Cleanup, since app is going down
  }
}
