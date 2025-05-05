import { DynamoPlayerRepository } from '@/repositories/dynamodb/dynamo-player-repository.js'
import { DynamoLobbyRepository } from '@/repositories/dynamodb/dynamo-lobby-repository.js'
import { JoinLobbyUseCase } from '../join-lobby.js'

export function makeJoinLobbyUseCase(): JoinLobbyUseCase {
  const lobbyRepository = new DynamoLobbyRepository()
  const playerRepository = new DynamoPlayerRepository()

  return new JoinLobbyUseCase(lobbyRepository, playerRepository)
}
