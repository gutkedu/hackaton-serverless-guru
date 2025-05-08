import { GameEventType, GameStartedEvent } from '@/core/events/game-events.js'
import { QuotesProvider } from '@/providers/quotes-api/quotes-provider.js'
import { TopicsProvider } from '@/providers/topics/topics-provider.js'
import { LobbyRepository } from '@/repositories/lobby-repository.js'
import { PlayerRepository } from '@/repositories/player-repository.js'
import { BusinessError } from '@/shared/errors/business-error.js'
import { getLogger } from '@/shared/logger/get-logger.js'
import { randomUUID } from 'crypto'

const logger = getLogger()

interface StartGameRequest {
  lobbyId: string
}

export class StartGameUseCase {
  constructor(
    private readonly lobbyRepository: LobbyRepository,
    private readonly playerRepository: PlayerRepository,
    private readonly quoteProvider: QuotesProvider,
    private readonly topicProvider: TopicsProvider
  ) {}

  async execute({ lobbyId }: StartGameRequest): Promise<void> {
    const lobby = await this.lobbyRepository.getById(lobbyId)
    if (!lobby) {
      logger.error(`Lobby ${lobbyId} not found`)
      throw new BusinessError('Lobby not found')
    }

    const randomQuote = await this.quoteProvider.getRandomQuote({
      minLength: 140
    })

    const eventMessage: GameStartedEvent = {
      content: randomQuote.content,
      gameId: randomUUID(),
      lobbyId,
      timestamp: Date.now(),
      type: GameEventType.GAME_STARTED
    }

    await this.topicProvider.publish(`lobby-${lobbyId}`, JSON.stringify({ eventMessage }))
  }
}
