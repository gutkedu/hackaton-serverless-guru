import { DynamoLobbyRepository } from '@/repositories/dynamodb/dynamo-lobby-repository.js'
import { ListLobbiesUseCase } from '../list-lobbies.js'

export function makeListLobbiesUseCase(): ListLobbiesUseCase {
  const lobbyRepository = new DynamoLobbyRepository()
  return new ListLobbiesUseCase(lobbyRepository)
}
