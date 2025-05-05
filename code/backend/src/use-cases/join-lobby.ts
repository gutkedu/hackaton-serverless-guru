import { LobbyStatus } from '@/entities/lobby.js'
import { LobbyRepository } from '@/repositories/lobby-repository.js'
import { PlayerRepository } from '@/repositories/player-repository.js'
import { BusinessError } from '@/shared/errors/business-error.js'

interface JoinLobbyRequest {
  lobbyId: string
  username: string
}

export class JoinLobbyUseCase {
  constructor(private lobbyRepository: LobbyRepository, private playerRepository: PlayerRepository) {}

  async execute({ lobbyId, username }: JoinLobbyRequest): Promise<void> {
    const lobby = await this.lobbyRepository.getById(lobbyId)
    if (!lobby) {
      throw new BusinessError('Lobby not found')
    }

    if (lobby.status !== LobbyStatus.OPEN) {
      throw new BusinessError('Lobby is not open for joining')
    }

    // Get the player
    const player = await this.playerRepository.getByUsername(username)
    if (!player) {
      throw new BusinessError('Player not found')
    }

    // Check if player is already in a lobby
    if (player.currentLobbyId) {
      if (player.currentLobbyId === lobbyId) {
        return
      }
      throw new BusinessError('Player is already in a different lobby')
    }

    // Try to add the player to the lobby
    if (!lobby.addPlayer(username)) {
      throw new BusinessError('Failed to join lobby. It may be full.')
    }

    // Update lobby and player
    await this.lobbyRepository.update(lobby)

    player.setCurrentLobby(lobbyId)

    await this.playerRepository.update(player)
  }
}
