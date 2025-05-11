import { FastifyInstance } from 'fastify'
import { getLogger } from '@/shared/logger/get-logger.js'

const logger = getLogger('events-handler')

//TODO: Add aws auth v4

export async function eventsRoutes(fastify: FastifyInstance) {
  fastify.post('/events/game-started', async (request, reply) => {
    try {
      logger.info('Received game event from EventBridge', {
        body: request.body
      })

      return { success: true, message: 'Event processed successfully' }
    } catch (error) {
      logger.error('Error processing event', { error })
      return reply.status(500).send({
        success: false,
        message: 'Failed to process event',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })
}
