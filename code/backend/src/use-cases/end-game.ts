import { LobbyRepository } from '../repositories/lobby-repository.js'
import { PlayerRepository } from '../repositories/player-repository.js'
import { getLogger } from '@/shared/logger/get-logger.js'
import { LobbyStatus } from '@/core/entities/lobby.js'
import { EventProvider } from '@/providers/event/event-provider.js'
import { EventBridgeType } from '@/providers/event/events-dto.js'
import { BusinessError } from '@/shared/errors/business-error.js'

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
    logger.info('EndGameUseCase - Starting to process game end', { lobbyId: input.lobbyId })

    try {
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
        }
      }

      // Update lobby status
      lobby.setStatus(LobbyStatus.OPEN)
      await this.lobbyRepository.update(lobby)

      // Send game ended event
      await this.eventProvider.sendEvent(EventBridgeType.GAME_ENDED, {
        lobbyId: input.lobbyId,
        players: input.players,
        winner: winner
          ? {
              username: winner.username,
              wpm: winner.wpm
            }
          : undefined,
        timestamp: new Date().toISOString()
      })

      logger.info('EndGameUseCase - Successfully processed game end', {
        lobbyId: input.lobbyId,
        winner: winner?.username
      })
    } catch (error) {
      logger.error('EndGameUseCase - Error processing game end', {
        lobbyId: input.lobbyId,
        error
      })
      throw error
    }
  }
}
