import { GameStatisticsEntity } from '@/core/entities/game-statistics.js'

export interface GameStatisticsRepository {
  get(): Promise<GameStatisticsEntity | null>
  save(gameStatistics: GameStatisticsEntity): Promise<void>
  incrementTotalGamesStarted(amount?: number): Promise<number | undefined> // Returns updated value
  incrementTotalGamesFinished(amount?: number): Promise<number | undefined> // Returns updated value
}
