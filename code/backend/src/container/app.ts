import fastify from 'fastify'

import { ZodError } from 'zod'
import { env } from './env/env.js'

export const app = fastify()

app.get('/hello', async () => {
  return {
    message: 'Hello World!',
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
