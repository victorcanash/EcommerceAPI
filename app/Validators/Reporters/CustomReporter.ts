import {
  // ValidationException,
  MessagesBagContract,
  ErrorReporterContract,
} from '@ioc:Adonis/Core/Validator'

import ValidationException from 'App/Exceptions/ValidationException'

/**
 * The shape of an individual error
 */
export type FieldErrorNode = {
  error: string
  name: string
}

export class CustomReporter implements ErrorReporterContract<{ errors: FieldErrorNode[] }> {
  public hasErrors = false

  public validatorName = 'Validator'

  /**
   * Tracking reported errors
   */
  private errors: FieldErrorNode[] = []

  constructor(private messages: MessagesBagContract, private bail: boolean) {}

  /**
   * Invoked by the validation rules to
   * report the error
   */
  public report(
    pointer: string,
    rule: string,
    message: string,
    arrayExpressionPointer?: string,
    args?: any
  ) {
    /**
     * Turn on the flag
     */
    this.hasErrors = true

    /**
     * Use messages bag to get the error message. The messages
     * bag also checks for the user-defined error messages and
     * hence must always be used
     */
    const errorMessage = this.messages.get(pointer, rule, message, arrayExpressionPointer, args)

    /**
     * Track error message
     */
    this.errors.push({ error: errorMessage, name: pointer })

    /**
     * Bail mode means stop validation on the first
     * error itself
     */
    if (this.bail) {
      throw this.toError()
    }
  }

  /**
   * Converts validation failures to an exception
   */
  public toError() {
    throw new ValidationException(`${this.validatorName} error`, this.errors)
  }

  /**
   * Get error messages as JSON
   */
  public toJSON() {
    return { errors: this.errors }
  }
}
