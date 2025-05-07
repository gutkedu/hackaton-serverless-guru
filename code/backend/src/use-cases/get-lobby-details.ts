import { LobbyEntity } from '@/core/entities/lobby.js'
import { PlayerEntity } from '@/core/entities/player.js'
import { LobbyRepository } from '@/repositories/lobby-repository.js'
import { PlayerRepository } from '@/repositories/player-repository.js'
import { IntegrationError } from '@/shared/errors/integration-error.js'

interface GetLobbyDetailsRequest {
  lobbyId: string
}

interface GetLobbyDetailsResponse {
  lobby: LobbyEntity
  players: PlayerEntity[]
}

export class GetLobbyDetailsUseCase {
  constructor(private lobbyRepository: LobbyRepository, private playerRepository: PlayerRepository) {}

  async execute({ lobbyId }: GetLobbyDetailsRequest): Promise<GetLobbyDetailsResponse> {
    const lobby = await this.lobbyRepository.getById(lobbyId)
    if (!lobby) {
      throw new IntegrationError('Lobby not found')
    }

    const players = await this.playerRepository.getPlayersInLobby(lobbyId)

    return {
      lobby,
      players
    }
  }
}
