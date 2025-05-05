import { LeaveLobbyUseCase } from '@/use-cases/leave-lobby.js'
import { DynamoLobbyRepository } from '@/repositories/dynamodb/dynamo-lobby-repository.js'
import { DynamoPlayerRepository } from '@/repositories/dynamodb/dynamo-player-repository.js'

export function makeLeaveLobbyUseCase(): LeaveLobbyUseCase {
  const lobbyRepository = new DynamoLobbyRepository()
  const playerRepository = new DynamoPlayerRepository()

  return new LeaveLobbyUseCase(lobbyRepository, playerRepository)
}
