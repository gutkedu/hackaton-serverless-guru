import { GameEventType } from '@/core/events/game-events.js'
import { TopicsProvider } from '@/providers/topics/topics-provider.js'
import { getLogger } from '@/shared/logger/get-logger.js'
import { generateLobbyTopicName } from '@/shared/topics/generate-topic-name.js'

const logger = getLogger('game-listener')

interface GameListenerInput {
  lobbyId: string
  gameId: string
  content: string
  type: GameEventType
  timestamp: number
}

export class GameListenerUseCase {
  constructor(private readonly topicsProvider: TopicsProvider) {}

  async execute({ lobbyId, gameId, content, type, timestamp }: GameListenerInput): Promise<void> {
    try {
      const topicName = generateLobbyTopicName(lobbyId)

      logger.info(`Processing game event for lobby ${lobbyId}`, {
        gameId,
        type,
        topicName
      })

      //subscribe to momento topic

      logger.info(`Event published to topic ${topicName}`, { type })
    } catch (error) {
      logger.error('Error processing game event', { error, lobbyId, gameId, type })
      throw error
    }
  }
}
