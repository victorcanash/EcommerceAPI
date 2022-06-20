import { ErrorNode } from 'App/Validators/Reporters/CustomReporter'

/**
 * Error JSON response for Controllers
 */
export type BasicErrorResponse = {
  code: number
  error: string
  message: string
}

export type ValidationErrorResponse = {
  code: number
  errors: ErrorNode[]
}
