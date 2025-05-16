import { EventBridgeEvent } from 'aws-lambda'
import { getLogger } from '@/shared/logger/get-logger.js'
import middy from '@middy/core'
import secretsManager from '@middy/secrets-manager'
import { MiddyContext } from '@/shared/middy/middy-context.js'
import { makeGameListenerUseCase } from '@/use-cases/factories/make-game-listener.js'
import { EventBridgeType } from '@/providers/event/events-dto.js'
import { GameStartedDetail } from '@/providers/event/events-detail.js'
import { SECRET_MANAGER_MOMENTO_KEYS } from '@/core/constants/secret-manager-keys.js'
import { GameEventType } from '@/core/events/game-events.js'

const logger = getLogger('game-listener-lambda')

type GameEventDetail = GameStartedDetail

const handler = async (event: EventBridgeEvent<string, GameEventDetail>, context: MiddyContext): Promise<void> => {
  // Ensure we get all the time we need up to the timeout
  context.callbackWaitsForEmptyEventLoop = false

  logger.appendKeys({
    requestId: context.awsRequestId,
    eventType: event['detail-type']
  })

  logger.info('Starting game listener lambda', { event })

  const detailType = event['detail-type'] as EventBridgeType
  const eventDetail = event.detail

  if (detailType !== EventBridgeType.GAME_STARTED) {
    logger.warn(`Unhandled event type: ${detailType}`)
    return
  }

  try {
    const { data } = eventDetail as GameStartedDetail

    const gameListener = makeGameListenerUseCase(context.momentoApiKeys.MOMENTO_USER_USER_KEY)

    // Set timeout to slightly less than Lambda timeout to ensure clean exit
    const gameTimeoutMs = 4 * 60 * 1000 // 4 minutes

    logger.info('Starting game listener for lobby', {
      gameId: data.gameId,
      lobbyId: data.lobbyId,
      contentLength: data.content.length,
      gameTimeout: gameTimeoutMs
    })

    // Execute the use case and wait for completion or timeout
    await Promise.race([
      gameListener.execute({
        gameId: data.gameId,
        lobbyId: data.lobbyId,
        content: data.content,
        type: GameEventType.GAME_STARTED,
        timestamp: data.timestamp
      }),

      // Set a timeout that resolves after game duration
      new Promise((resolve) =>
        setTimeout(() => {
          logger.info('Game timeout reached, ending listener', {
            gameId: data.gameId,
            lobbyId: data.lobbyId
          })
          resolve(undefined)
        }, gameTimeoutMs)
      )
    ])

    logger.info('Game listener completed', {
      gameId: data.gameId,
      lobbyId: data.lobbyId
    })
  } catch (error) {
    logger.error('Error in game listener', { error, eventType: detailType })
    throw error
  }
}

export const gameListenerHandler = middy(handler).use(
  secretsManager({
    cacheExpiry: 10 * 60 * 1000, // 10 minutes
    fetchData: {
      momentoApiKeys: SECRET_MANAGER_MOMENTO_KEYS
    },
    awsClientOptions: {
      region: process.env.AWS_REGION
    },
    setToContext: true
  })
)
