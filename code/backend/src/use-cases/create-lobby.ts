import { LobbyEntity } from '@/core/entities/lobby.js'
import { LobbyRepository } from '@/repositories/lobby-repository.js'
import { PlayerRepository } from '@/repositories/player-repository.js'
import { IntegrationError } from '@/shared/errors/integration-error.js'

interface CreateLobbyRequest {
  name: string
  hostUsername: string
  maxPlayers: number
}

interface CreateLobbyResponse {
  lobby: LobbyEntity
}

export class CreateLobbyUseCase {
  constructor(private lobbyRepository: LobbyRepository, private playerRepository: PlayerRepository) {}

  async execute({ name, hostUsername, maxPlayers }: CreateLobbyRequest): Promise<CreateLobbyResponse> {
    // Validate the host player
    const host = await this.playerRepository.getByUsername(hostUsername)
    if (!host) {
      throw new IntegrationError('Host player not found')
    }

    // Check if player is already in a lobby
    if (host.currentLobbyId) {
      throw new IntegrationError('Player is already in a lobby')
    }

    // Create the lobby
    const lobby = LobbyEntity.create({
      name,
      hostId: host.id,
      maxPlayers: maxPlayers ?? 4
    })

    await this.lobbyRepository.create(lobby)

    // Update the player's current lobby
    host.setCurrentLobby(lobby.id)
    await this.playerRepository.update(host)

    return {
      lobby
    }
  }
}
