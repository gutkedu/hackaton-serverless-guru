import { StartGameUseCase } from '@/use-cases/start-game.js'
import { DynamoLobbyRepository } from '@/repositories/dynamodb/dynamo-lobby-repository.js'
import { DynamoPlayerRepository } from '@/repositories/dynamodb/dynamo-player-repository.js'
import { QuotableApiProvider } from '@/providers/quotes-api/quotable-provider.js'
import { MomentoTopicsProvider } from '@/providers/topics/momento-topics.js'

export function makeStartGameUseCase(momentoApiKey: string, cacheName: string) {
  const lobbyRepository = new DynamoLobbyRepository()
  const playerRepository = new DynamoPlayerRepository()
  const quotesProvider = new QuotableApiProvider()
  const topicsProvider = new MomentoTopicsProvider(momentoApiKey, cacheName)

  return new StartGameUseCase(lobbyRepository, playerRepository, quotesProvider, topicsProvider)
}
