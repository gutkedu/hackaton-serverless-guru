import { LobbyRepository } from '../repositories/lobby-repository.js'
import { PlayerRepository } from '../repositories/player-repository.js'
import { getLogger } from '@/shared/logger/get-logger.js'
import { LobbyStatus } from '@/core/entities/lobby.js'
import { EventProvider } from '@/providers/event/event-provider.js'
import { EventBridgeType } from '@/providers/event/events-dto.js'
import { BusinessError } from '@/shared/errors/business-error.js'
import { GameEndedDetail } from '@/providers/event/events-detail.js'
import { GameEventType } from '@/core/events/game-events.js'

interface EndGameInput {
  lobbyId: string
  players: Array<{
    username: string
    wpm: number
    progress: number
  }>
}

const logger = getLogger()

export class EndGameUseCase {
  constructor(
    private readonly lobbyRepository: LobbyRepository,
    private readonly playerRepository: PlayerRepository,
    private readonly eventProvider: EventProvider
  ) {}

  async execute(input: EndGameInput): Promise<void> {
    const lobby = await this.lobbyRepository.getById(input.lobbyId)
    if (!lobby) {
      logger.warn('EndGameUseCase - Lobby not found', { lobbyId: input.lobbyId })
      throw new BusinessError(`Lobby with ID ${input.lobbyId} not found`)
    }

    const sortedPlayers = [...input.players].sort((a, b) => {
      if (b.progress !== a.progress) {
        return b.progress - a.progress
      }
      return b.wpm - a.wpm
    })
    const winner = sortedPlayers.length > 0 ? sortedPlayers[0] : undefined

    for (const player of input.players) {
      const playerEntity = await this.playerRepository.getByUsername(player.username)
      if (playerEntity) {
        playerEntity.incrementGamesPlayed()
        if (player.wpm > 0) {
          playerEntity.updateBestWpm(player.wpm)
        }
        if (winner && winner.username === player.username) {
          playerEntity.incrementWins()
        }
        await this.playerRepository.update(playerEntity)
        logger.info('EndGameUseCase - Updated player stats', {
          username: player.username,
          gamesPlayed: playerEntity.gamesPlayed,
          wins: playerEntity.wins,
          bestWpm: playerEntity.bestWpm,
          progress: player.progress
        })
      }
      logger.warn('EndGameUseCase - Player not found', { username: player.username })
    }

    lobby.setStatus(LobbyStatus.OPEN)
    await this.lobbyRepository.update(lobby)

    await this.eventProvider.sendEvent(EventBridgeType.GAME_ENDED, {
      data: {
        gameId: lobby.id,
        lobbyId: input.lobbyId,
        players: input.players,
        winner: winner
          ? {
              username: winner.username,
              wpm: winner.wpm,
              progress: winner.progress
            }
          : undefined,
        type: GameEventType.GAME_ENDED,
        timestamp: Date.now()
      }
    } as GameEndedDetail)

    logger.info('EndGameUseCase - Successfully processed game end', {
      lobbyId: input.lobbyId,
      winner: winner?.username
    })
  }
}
