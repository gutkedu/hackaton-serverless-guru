import { FastifyRequest, FastifyReply } from 'fastify'
import { getLogger } from '@/shared/logger/get-logger.js'
import { makeGameListenerUseCase } from '@/use-cases/factories/make-game-listener.js'
import { GameStartedDetail } from '@/providers/event/events-detail.js'

import { EventBridgeEvent } from 'aws-lambda'
import { EventBridgeType } from '@/providers/event/events-dto.js'
import { GameEventType } from '@/core/events/game-events.js'
import { env } from '@/container/env/env.js'

const logger = getLogger('game-events-controller')

export async function gameStartedController(request: FastifyRequest, reply: FastifyReply) {
  try {
    logger.info('Received game event from EventBridge', {
      body: request.body
    })

    const payload = request.body as EventBridgeEvent<EventBridgeType.GAME_STARTED, GameStartedDetail>

    const useCase = makeGameListenerUseCase()

    await useCase.execute({
      gameId: payload.detail.data.gameId,
      lobbyId: payload.detail.data.lobbyId,
      content: payload.detail.data.content,
      type: GameEventType.GAME_STARTED,
      momentoApiKey: env.MOMENTO_API_KEYS.MOMENTO_USER_USER_KEY
    })

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
