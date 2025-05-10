import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  USER_POOL_ID: z.string().optional(),
  USER_POOL_CLIENT_ID: z.string().optional(),
  TABLE_NAME: z.string().optional()
})

export const env = envSchema.parse(process.env)
