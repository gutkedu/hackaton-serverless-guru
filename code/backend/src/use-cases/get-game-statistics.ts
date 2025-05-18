import { GameStatisticsRepository } from '@/repositories/game-statistics-repository.js'
import { getLogger } from '@/shared/logger/get-logger.js'
import { BusinessError } from '@/shared/errors/business-error.js'

const logger = getLogger()

export interface GetGameStatisticsResponse {
  totalGamesStarted: number
  totalGamesFinished: number
  topPlayersScoreboard: Array<{
    username: string
    bestWpm: number
    gamesPlayedInvolvingScoreboard: number
    lastGameTimestamp: string
  }>
}

export class GetGameStatisticsUseCase {
  constructor(private readonly gameStatsRepository: GameStatisticsRepository) {}

  async execute(): Promise<GetGameStatisticsResponse> {
    const statsEntity = await this.gameStatsRepository.get()

    if (!statsEntity || !statsEntity.createdAt) {
      logger.error('GameStatisticsEntity is not initialized.')
      throw new BusinessError('Game statistics are not available.')
    }

    logger.info('Successfully retrieved game statistics', { statsId: statsEntity.id })

    return {
      totalGamesStarted: statsEntity.totalGamesStarted,
      totalGamesFinished: statsEntity.totalGamesFinished,
      topPlayersScoreboard: statsEntity.topPlayersScoreboard
    }
  }
}
