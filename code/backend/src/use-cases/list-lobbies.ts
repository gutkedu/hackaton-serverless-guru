import { LobbyStatus, LobbyEntity } from '@/entities/lobby.js'
import { LobbyRepository } from '@/repositories/lobby-repository.js'

interface ListLobbiesRequest {
  status?: LobbyStatus
  limit?: number
  nextToken?: string
}

interface ListLobbiesResponse {
  lobbies: LobbyEntity[]
  nextToken?: string
}

export class ListLobbiesUseCase {
  constructor(private lobbyRepository: LobbyRepository) {}

  async execute({ status, limit, nextToken }: ListLobbiesRequest): Promise<ListLobbiesResponse> {
    const result = await this.lobbyRepository.listLobbies({
      status: status || LobbyStatus.OPEN,
      limit,
      nextToken
    })

    return {
      lobbies: result.lobbies,
      nextToken: result.nextToken
    }
  }
}
