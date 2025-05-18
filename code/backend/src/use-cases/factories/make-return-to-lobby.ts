import { DynamoPlayerRepository } from '@/repositories/dynamodb/dynamo-player-repository.js'
import { DynamoLobbyRepository } from '@/repositories/dynamodb/dynamo-lobby-repository.js'
import { ReturnToLobbyUseCase } from '../return-to-lobby.js'

export function makeReturnToLobbyUseCase(): ReturnToLobbyUseCase {
  const lobbyRepository = new DynamoLobbyRepository()
  const playerRepository = new DynamoPlayerRepository()

  return new ReturnToLobbyUseCase(lobbyRepository, playerRepository)
}
