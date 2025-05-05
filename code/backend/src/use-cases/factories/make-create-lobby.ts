import { DynamoLobbyRepository } from '@/repositories/dynamodb/dynamo-lobby-repository.js'
import { DynamoPlayerRepository } from '@/repositories/dynamodb/dynamo-player-repository.js'
import { CreateLobbyUseCase } from '../create-lobby.js'

export function makeCreateLobbyUseCase(): CreateLobbyUseCase {
  const lobbyRepository = new DynamoLobbyRepository()
  const playerRepository = new DynamoPlayerRepository()

  return new CreateLobbyUseCase(lobbyRepository, playerRepository)
}
