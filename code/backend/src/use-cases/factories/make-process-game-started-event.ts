import { ProcessGameStartedEventUseCase } from '../process-game-started-event.js'
import { DynamoGameStatisticsRepository } from '@/repositories/dynamodb/dynamo-game-statistics-repository.js'

export function makeProcessGameStartedEventUseCase(): ProcessGameStartedEventUseCase {
  const gameStatsRepository = new DynamoGameStatisticsRepository()
  return new ProcessGameStartedEventUseCase(gameStatsRepository)
} 