import { StartGameUseCase } from '@/use-cases/start-game.js'
import { DynamoLobbyRepository } from '@/repositories/dynamodb/dynamo-lobby-repository.js'
import { QuotableApiProvider } from '@/providers/quotes-api/quotable-provider.js'
import { MomentoTopicsProvider } from '@/providers/topics/momento-topics.js'
import { EventBridgeProvider } from '@/providers/event/event-bridge.js'

export function makeStartGameUseCase(momentoApiKey: string, cacheName: string) {
  const lobbyRepository = new DynamoLobbyRepository()
  const quotesProvider = new QuotableApiProvider()
  const topicsProvider = new MomentoTopicsProvider(momentoApiKey, cacheName)
  const eventProvider = new EventBridgeProvider()

  return new StartGameUseCase(lobbyRepository, quotesProvider, topicsProvider, eventProvider)
}
