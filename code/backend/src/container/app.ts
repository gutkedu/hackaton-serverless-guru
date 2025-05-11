import fastify from 'fastify'
import { ZodError } from 'zod'
import { env } from './env/env.js'
import { fastifyJwtAuth, requireAuthentication } from './auth/fastify-jwt-auth.js'

export const app = fastify()

// Register the JWT authentication plugin
app.register(fastifyJwtAuth, {
  userPoolClientId: process.env.USER_POOL_CLIENT_ID
})

app.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString()
  }
})

// Example of a protected route requiring authentication
app.get('/protected', { preHandler: requireAuthentication }, async (request) => {
  return {
    message: `Hello, ${request.user?.username}!`,
    userId: request.user?.userId,
    email: request.user?.email,
    timestamp: new Date().toISOString()
  }
})

app.setErrorHandler((error, _request, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: 'Validation error.',
      issues: error.format()
    })
  }

  if (env.NODE_ENV !== 'production') {
    console.error(error)
  } else {
    // TODO: Here we should log to an external tool like DataDog/newRelic/Sentry
  }

  return reply.status(500).send({ message: 'Internal server error.' })
})
