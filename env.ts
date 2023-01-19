/*
|--------------------------------------------------------------------------
| Validating Environment Variables
|--------------------------------------------------------------------------
|
| In this file we define the rules for validating environment variables.
| By performing validation we ensure that your application is running in
| a stable environment with correct configuration values.
|
| This file is read automatically by the framework during the boot lifecycle
| and hence do not rename or move this file to a different location.
|
*/

import Env from '@ioc:Adonis/Core/Env'

export default Env.rules({
  HOST: Env.schema.string.optional({ format: 'host' }),
  PORT: Env.schema.number.optional(),
  APP_URL: Env.schema.string({ format: 'url', tld: false, protocol: false }),
  APP_KEY: Env.schema.string(),
  APP_NAME: Env.schema.string(),
  DRIVE_DISK: Env.schema.enum(['local', 's3'] as const),
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  DB_CONNECTION: Env.schema.string(),
  DATABASE_URL: Env.schema.string.optional(),
  PG_HOST: Env.schema.string.optional({ format: 'host' }),
  PG_PORT: Env.schema.number.optional(),
  PG_USER: Env.schema.string.optional(),
  PG_PASSWORD: Env.schema.string.optional(),
  PG_DB_NAME: Env.schema.string.optional(),
  API_TOKEN_EXPIRY: Env.schema.string(),
  ACTIVATION_TOKEN_EXPIRY: Env.schema.string(),
  UPDATE_TOKEN_EXPIRY: Env.schema.string(),
  LOG_LEVEL: Env.schema.string.optional(),
  DEV_CORS_ORIGIN: Env.schema.string.optional(),
  PROD_CORS_ORIGIN_1: Env.schema.string.optional(),
  PROD_CORS_ORIGIN_2: Env.schema.string.optional(),
  PROD_CORS_ORIGIN_3: Env.schema.string.optional(),
  PROD_CORS_ORIGIN_4: Env.schema.string.optional(),
  PROD_CORS_ORIGIN_5: Env.schema.string.optional(),
  PROD_CORS_ORIGIN_6: Env.schema.string.optional(),
  // S3_KEY: Env.schema.string(),
  // S3_SECRET: Env.schema.string(),
  // S3_BUCKET: Env.schema.string(),
  // S3_REGION: Env.schema.string(),
  // S3_ENDPOINT: Env.schema.string.optional(),
  SMTP_HOST: Env.schema.string({ format: 'host' }),
  SMTP_PORT: Env.schema.number(),
  SMTP_USERNAME: Env.schema.string(),
  SMTP_PASSWORD: Env.schema.string(),
  SMTP_EMAIL: Env.schema.string(),
  // STRIPE_SECRET: Env.schema.string(),
  // STRIPE_SUCCESS_ENDPOINT: Env.schema.string(),
  // STRIPE_CANCEL_ENDPOINT: Env.schema.string(),
  // STRIPE_WEBHOOKS_SECRET: Env.schema.string(),
  BRAINTREE_MERCHANT_ID: Env.schema.string(),
  BRAINTREE_PUBLIC_KEY: Env.schema.string(),
  BRAINTREE_PRIVATE_KEY: Env.schema.string(),
  BIGBUY_API_KEY: Env.schema.string(),
  BIGBUY_API_URL: Env.schema.string(),
})
