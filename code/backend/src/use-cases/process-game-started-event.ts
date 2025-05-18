import { GameStatisticsRepository } from '@/repositories/game-statistics-repository.js'
import { GameStatisticsEntity } from '@/core/entities/game-statistics.js'
import { getLogger } from '@/shared/logger/get-logger.js'

const logger = getLogger()

interface GameStartedEventDetailInput {
  data: {
    lobbyId: string
    gameId: string
    timestamp: string | number
  }
}

export class ProcessGameStartedEventUseCase {
  constructor(private readonly gameStatsRepository: GameStatisticsRepository) {}

  async execute(eventDetail: GameStartedEventDetailInput): Promise<void> {
    logger.info('Processing gameStarted event', { lobbyId: eventDetail.data.lobbyId, gameId: eventDetail.data.gameId })

    const newTotalGamesStarted = await this.gameStatsRepository.incrementTotalGamesStarted(1)
    logger.info('Atomically incremented totalGamesStarted', { newTotalGamesStarted })

    if (newTotalGamesStarted !== undefined && newTotalGamesStarted === 1) {
      const stats = await this.gameStatsRepository.get()
      if (!stats || !stats.createdAt) {
        logger.info('Game statistics item is new or minimally created by gameStarted. Ensuring full initialization.', {
          currentStatsExistence: !!stats
        })

        const fullyInitializedStats = GameStatisticsEntity.create({
          totalGamesStarted: newTotalGamesStarted,
          totalGamesFinished: stats?.totalGamesFinished
        })

        await this.gameStatsRepository.save(fullyInitializedStats)
        logger.info('Fully initialized game statistics entity saved/updated by gameStarted.', {
          statsId: fullyInitializedStats.id
        })
      }
    }
  }
}
