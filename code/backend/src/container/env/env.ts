import { z } from 'zod'
import { MomentoSecretsDTO } from '@/shared/middy/secrets-dto.js'

const momentoSecretsSchema = z.object({
  MOMENTO_USER_USER_KEY: z.string()
})

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  USER_POOL_ID: z.string().optional(),
  USER_POOL_CLIENT_ID: z.string().optional(),
  TABLE_NAME: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  MOMENTO_API_KEYS: z.string().transform((value) => {
    try {
      const parsedValue = JSON.parse(value)
      return momentoSecretsSchema.parse(parsedValue) as MomentoSecretsDTO
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      throw new Error(`Invalid format for env:MOMENTO_API_KEYS: ${error.message}`)
    }
  })
})

const _env = envSchema.safeParse(process.env)

if (_env.success === false) {
  console.error('🥶 Invalid environment variables', _env.error.format())
  throw new Error('Invalid environment variables')
} else {
  console.log('🥳 Environment variables loaded successfully')
}

export const env = _env.data
