import * as dotenv from 'dotenv'

dotenv.config()

if (!process.env.DATABASE_URL) {
  throw new Error('Database URL is not set')
}

if (!process.env.AUTH_TENANT_DOMAIN || !process.env.AUTH_AUDIENCE) {
  throw new Error('Auth0 environment variables are not set')
}

export const env = {
  PORT: Number(process.env.PORT) || 3333,
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_DOMAIN: process.env.AUTH_TENANT_DOMAIN,
  AUTH_AUDIENCE: process.env.AUTH_AUDIENCE,
}
