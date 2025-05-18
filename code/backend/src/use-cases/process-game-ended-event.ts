import { GameStatisticsRepository } from '@/repositories/game-statistics-repository.js'
import { getLogger } from '@/shared/logger/get-logger.js'
import { BusinessError } from '@/shared/errors/business-error.js'
import { GameEndedDetail } from '@/providers/event/events-detail.js'

const logger = getLogger()

const MAX_SCOREBOARD_PLAYERS = 15

export class ProcessGameEndedEventUseCase {
  constructor(private readonly gameStatsRepository: GameStatisticsRepository) {}

  async execute({ data }: GameEndedDetail): Promise<void> {
    const newTotalGamesFinished = await this.gameStatsRepository.incrementTotalGamesFinished(1)
    logger.info('Atomically incremented totalGamesFinished', { newTotalGamesFinished })

    const statsEntity = await this.gameStatsRepository.get()

    if (!statsEntity || !statsEntity.createdAt) {
      logger.error('GameStatisticsEntity is not initialized. Cannot update scoreboard for this event.')
      throw new BusinessError('GameStatisticsEntity is not initialized. Cannot update scoreboard for this event.')
    }

    if (newTotalGamesFinished !== undefined && statsEntity.totalGamesFinished !== newTotalGamesFinished) {
      logger.warn('Mismatch in totalGamesFinished count after atomic op and get. Syncing entity.', {
        entityCount: statsEntity.totalGamesFinished,
        atomicCount: newTotalGamesFinished
      })
      statsEntity.setTotalGamesFinished(newTotalGamesFinished)
    }

    if (data.players && data.players.length > 0) {
      for (const player of data.players) {
        if (player.wpm > 0) {
          statsEntity.updatePlayerOnScoreboard(
            {
              username: player.username,
              wpm: player.wpm,
              gameTimestamp: data.timestamp.toString()
            },
            MAX_SCOREBOARD_PLAYERS
          )
        }
      }
    }

    await this.gameStatsRepository.save(statsEntity)
    logger.info('Game statistics (including scoreboard) updated for gameEnded event', { statsId: statsEntity.id })
  }
}
