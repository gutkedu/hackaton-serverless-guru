import { ProcessGameEndedEventUseCase } from '../process-game-ended-event.js'
import { DynamoGameStatisticsRepository } from '@/repositories/dynamodb/dynamo-game-statistics-repository.js'

export function makeProcessGameEndedEventUseCase(): ProcessGameEndedEventUseCase {
  const gameStatsRepository = new DynamoGameStatisticsRepository()
  return new ProcessGameEndedEventUseCase(gameStatsRepository)
} 