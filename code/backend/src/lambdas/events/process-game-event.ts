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

const logger = getLogger('process-game-event')

type GameEventDetail = GameStartedDetail

const handler = async (event: EventBridgeEvent<string, GameEventDetail>, context: MiddyContext): Promise<void> => {
  logger.appendKeys({
    requestId: context.awsRequestId,
    eventType: event['detail-type']
  })

  logger.info('Processing game event', { event })

  const detailType = event['detail-type'] as EventBridgeType
  const eventDetail = event.detail

  try {
    switch (detailType) {
      case EventBridgeType.GAME_STARTED: {
        const { data } = eventDetail as GameStartedDetail

        const gameListener = makeGameListenerUseCase(context.momentoApiKeys.MOMENTO_USER_USER_KEY)

        await gameListener.execute({
          gameId: data.gameId,
          lobbyId: data.lobbyId,
          content: data.content,
          type: GameEventType.GAME_STARTED,
          timestamp: data.timestamp
        })

        logger.info('Game started event processed successfully')
        break
      }

      default:
        logger.warn(`Unhandled event type: ${detailType}`)
        break
    }
  } catch (error) {
    logger.error('Error processing event', { error, eventType: detailType })
    throw error
  }
}

export const processGameEventHandler = middy(handler).use(
  secretsManager({
    cacheExpiry: 10 * 60 * 1000,
    fetchData: {
      momentoApiKeys: SECRET_MANAGER_MOMENTO_KEYS
    },
    awsClientOptions: {
      region: process.env.AWS_REGION
    },
    setToContext: true
  })
)
