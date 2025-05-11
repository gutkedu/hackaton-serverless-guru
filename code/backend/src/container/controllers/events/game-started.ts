import { FastifyRequest, FastifyReply } from 'fastify'
import { getLogger } from '@/shared/logger/get-logger.js'

const logger = getLogger('game-events-controller')

export async function gameStartedController(request: FastifyRequest, reply: FastifyReply) {
  try {
    logger.info('Received game event from EventBridge', {
      body: request.body
    })

    //TODO: Implement your event processing logic here

    return reply.status(200).send({
      success: true,
      message: 'Event processed successfully'
    })
  } catch (error) {
    logger.error('Error processing game event', { error })

    return reply.status(500).send({
      success: false,
      message: 'Failed to process event',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
