import { DynamoPlayerRepository } from '@/repositories/dynamodb/dynamo-player-repository.js'
import { EndGameUseCase } from '../end-game.js'
import { EventBridgeProvider } from '@/providers/event/event-bridge.js'
import { DynamoLobbyRepository } from '@/repositories/dynamodb/dynamo-lobby-repository.js'

export function makeEndGameUseCase() {
  const lobbyRepository = new DynamoLobbyRepository()
  const playerRepository = new DynamoPlayerRepository()
  const eventBridge = new EventBridgeProvider()
  return new EndGameUseCase(lobbyRepository, playerRepository, eventBridge)
}
