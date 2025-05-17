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
  type: GameEventType
}

export class GameListenerUseCase {
  constructor() {}

  async execute({ lobbyId, gameId, type, momentoApiKey }: GameListenerInput): Promise<void> {
    try {
      const topicClient = momentoTopicClient({ apiKey: momentoApiKey, timeoutInMs: 5 * 60 * 1000 })
      const topicName = generateLobbyTopicName(lobbyId)

      logger.info(`Processing game event for lobby ${lobbyId}`, {
        gameId,
        topicName
      })

      let finishExecution = false

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

            setTimeout(async () => {
              finishExecution = true
            }, 4 * 60 * 1000)

            if (finishExecution) {
              logger.info('Game listener completed scheduled time', {
                gameId,
                lobbyId
              })
              return
            }
          } catch (err) {
            logger.error('Error processing message', {
              error: err,
              topicName
            })
          }
        }
      })
    } catch (error) {
      logger.error('Error processing game event', { error, lobbyId, gameId, type })
      throw error
    }
  }
}
