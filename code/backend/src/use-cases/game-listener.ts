import { AvailableMomentoCaches } from '@/core/enums/momento-caches.js'
import { BaseGameEvent, GameEventType } from '@/core/events/game-events.js'
import { momentoTopicClient } from '@/shared/clients/momento-topic.js'
import { getLogger } from '@/shared/logger/get-logger.js'
import { generateLobbyTopicName } from '@/shared/topics/generate-topic-name.js'

const logger = getLogger('game-listener')

interface GameListenerInput {
  momentoApiKey: string
  lobbyId: string
  gameId: string
  content: string
  gameEvent: GameEventType
}

export class GameListenerUseCase {
  constructor() {}

  async execute({ lobbyId, gameId, gameEvent, momentoApiKey }: GameListenerInput): Promise<void> {
    const TIMEOUT_IN_MS = 5 * 60 * 1000 // 5 minutes

    try {
      const topicClient = momentoTopicClient({ apiKey: momentoApiKey, timeoutInMs: TIMEOUT_IN_MS })
      const topicName = generateLobbyTopicName(lobbyId)

      logger.info(`Processing game event for lobby ${lobbyId}`, {
        gameId,
        topicName
      })

      await topicClient.subscribe(AvailableMomentoCaches.LOBBY, topicName, {
        onItem: (data) => {
          try {
            logger.info('Received message from Momento Topics', {
              topicName,
              messagePreview: data.value().toString().substring(0, 50) + '...',
              tokenId: data.tokenId()
            })

            const event = JSON.parse(data.value().toString()) as BaseGameEvent

            logger.info('Processing game event', {
              eventType: event.type,
              gameId: event.gameId
            })
          } catch (err) {
            logger.error('Error processing message', {
              error: err,
              topicName
            })
          }
        },
        onError: (error) => {
          logger.error('Error subscribing to topic', {
            error,
            topicName
          })
        }
      })
    } catch (error) {
      logger.error('Error processing game event', { error, lobbyId, gameId, gameEvent })
      throw error
    }
  }
}
