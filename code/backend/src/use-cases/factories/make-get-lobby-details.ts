import { GetLobbyDetailsUseCase } from '@/use-cases/get-lobby-details.js'
import { DynamoLobbyRepository } from '@/repositories/dynamodb/dynamo-lobby-repository.js'
import { DynamoPlayerRepository } from '@/repositories/dynamodb/dynamo-player-repository.js'

export function makeGetLobbyDetailsUseCase(): GetLobbyDetailsUseCase {
  const lobbyRepository = new DynamoLobbyRepository()
  const playerRepository = new DynamoPlayerRepository()

  return new GetLobbyDetailsUseCase(lobbyRepository, playerRepository)
}
