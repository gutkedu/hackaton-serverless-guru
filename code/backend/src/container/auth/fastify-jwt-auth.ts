import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { getLogger } from '@/shared/logger/get-logger.js'
import { makeCognitoProvider } from '@/use-cases/factories/make-cognito-provider.js'

const logger = getLogger('fastify-jwt-auth')

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      sub: string
      userId: string
      email: string
      username: string
    }
  }
}

export interface FastifyJwtAuthOptions {
  userPoolClientId?: string
}

export const fastifyJwtAuth = fp(async (fastify: FastifyInstance, options: FastifyJwtAuthOptions) => {
  const authProvider = makeCognitoProvider(options.userPoolClientId)

  fastify.decorateRequest('user')

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fastify.addHook('onRequest', async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization

      if (!authHeader) {
        logger.debug('No authorization header found')
        return
      }

      const token = authHeader.replace(/^Bearer\s/, '')

      if (!token) {
        logger.debug('No token found in authorization header')
        return
      }

      try {
        const userInfo = await authProvider.getUser(token)

        // Extract user information from Cognito attributes
        const email = userInfo.attributes?.email
        const username = userInfo.attributes?.preferred_username || userInfo.username
        const sub = userInfo.attributes?.sub

        if (!sub) {
          logger.warn('User ID missing from token')
          return
        }

        request.user = {
          sub: sub,
          userId: sub,
          email: email || '',
          username: username || ''
        }

        logger.info('User authenticated successfully', { username })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        // Handle specific Cognito errors
        if (error?.name === 'NotAuthorizedException') {
          logger.warn('Token not authorized', {
            message: error.message,
            tokenFirstChars: token.substring(0, 10) + '...'
          })
          return
        }

        if (error?.name === 'TokenExpiredError') {
          logger.info('Token expired')
          return
        }

        logger.warn('Invalid token', {
          errorName: error?.name,
          errorMessage: error?.message
        })
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logger.error('Error in JWT authentication', {
        errorName: error?.name,
        errorMessage: error?.message,
        stack: error?.stack?.split('\n').slice(0, 3).join('\n') // Log only first 3 lines of stack
      })
    }
  })
})

export const requireAuthentication = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user) {
    reply.status(401).send({
      error: 'Unauthorized',
      message: 'Authentication required'
    })
    return reply
  }
}
