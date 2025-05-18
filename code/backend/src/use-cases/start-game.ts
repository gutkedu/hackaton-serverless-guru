import { GameDifficulty } from '@/core/enums/game-difficulty.js'
import { LobbyStatus } from '@/core/entities/lobby.js'
import { QuotesProvider } from '@/providers/quotes-api/quotes-provider.js'
import { TopicsProvider } from '@/providers/topics/topics-provider.js'
import { LobbyRepository } from '@/repositories/lobby-repository.js'
import { BusinessError } from '@/shared/errors/business-error.js'
import { getLogger } from '@/shared/logger/get-logger.js'
import { generateLobbyTopicName } from '@/shared/topics/generate-topic-name.js'
import { randomUUID } from 'crypto'
import { EventProvider } from '@/providers/event/event-provider.js'
import { EventBridgeType } from '@/providers/event/events-dto.js'
import { GameStartedDetail } from '@/providers/event/events-detail.js'
import { GameEventType, GameStartedEvent } from '@/core/events/game-events.js'

const logger = getLogger()

interface StartGameRequest {
  lobbyId: string
  userId?: string // Optional: to validate if user is the host
  difficulty?: GameDifficulty
}

interface QuoteLength {
  minLength: number
  maxLength: number
}

export class StartGameUseCase {
  constructor(
    private readonly lobbyRepository: LobbyRepository,
    private readonly quoteProvider: QuotesProvider,
    private readonly topicProvider: TopicsProvider,
    private readonly eventProvider: EventProvider
  ) {}

  async execute({ lobbyId, userId, difficulty = GameDifficulty.MEDIUM }: StartGameRequest): Promise<void> {
    const lobby = await this.lobbyRepository.getById(lobbyId)
    if (!lobby) {
      logger.error(`Lobby ${lobbyId} not found`)
      throw new BusinessError('Lobby not found')
    }

    if (userId && lobby.hostId !== userId) {
      logger.error(`User ${userId} is not the host of lobby ${lobbyId}`)
      throw new BusinessError('Only the host can start the game')
    }

    if (lobby.status === LobbyStatus.IN_GAME) {
      logger.error(`Lobby ${lobbyId} is already in a game`)
      throw new BusinessError('Lobby is already in a game')
    }

    const { minLength, maxLength } = this.getQuoteLengthByDifficulty(difficulty)

    try {
      const randomQuote = await this.quoteProvider.getRandomQuote({
        minLength,
        maxLength
      })

      const gameId = randomUUID()

      lobby.status = LobbyStatus.IN_GAME
      await this.lobbyRepository.update(lobby)

      const eventMessage: GameStartedEvent = {
        content: randomQuote.content,
        gameId,
        lobbyId,
        timestamp: Date.now(),
        type: GameEventType.GAME_STARTED
      }

      const topicName = generateLobbyTopicName(lobbyId)
      await this.topicProvider.publish(topicName, JSON.stringify(eventMessage))

      await this.eventProvider.sendEvent(EventBridgeType.GAME_STARTED, {
        data: {
          content: randomQuote.content,
          gameId,
          lobbyId,
          timestamp: Date.now(),
          type: GameEventType.GAME_STARTED
        }
      } as GameStartedDetail)

      logger.info(`Game started in lobby ${lobbyId}`, { gameId, difficulty })
    } catch (error) {
      logger.error('Failed to start game', { error, lobbyId })
      throw new BusinessError('Failed to start game. Please try again.')
    }
  }

  private getQuoteLengthByDifficulty(difficulty: GameDifficulty): QuoteLength {
    switch (difficulty) {
      case GameDifficulty.EASY:
        return {
          minLength: 60,
          maxLength: 120
        }
      case GameDifficulty.MEDIUM:
        return {
          minLength: 120,
          maxLength: 200
        }
      case GameDifficulty.HARD:
      default:
        return {
          minLength: 200,
          maxLength: 400
        }
    }
  }
}
