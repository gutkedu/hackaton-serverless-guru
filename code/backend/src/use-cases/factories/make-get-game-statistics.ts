import { GetGameStatisticsUseCase } from '../get-game-statistics.js'
import { DynamoGameStatisticsRepository } from '@/repositories/dynamodb/dynamo-game-statistics-repository.js'

export function makeGetGameStatisticsUseCase(): GetGameStatisticsUseCase {
  const gameStatsRepository = new DynamoGameStatisticsRepository()
  return new GetGameStatisticsUseCase(gameStatsRepository)
}
