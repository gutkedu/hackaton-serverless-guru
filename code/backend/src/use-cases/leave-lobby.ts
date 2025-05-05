import { LobbyRepository } from '@/repositories/lobby-repository.js'
import { PlayerRepository } from '@/repositories/player-repository.js'
import { IntegrationError } from '@/shared/errors/integration-error.js'

interface LeaveLobbyRequest {
  username: string
}

interface LeaveLobbyResponse {
  success: boolean
  lobbyDeleted?: boolean
}

export class LeaveLobbyUseCase {
  constructor(private lobbyRepository: LobbyRepository, private playerRepository: PlayerRepository) {}

  async execute({ username }: LeaveLobbyRequest): Promise<LeaveLobbyResponse> {
    // Get the player
    const player = await this.playerRepository.getByUsername(username)
    if (!player) {
      throw new IntegrationError('Player not found')
    }

    // Check if player is in a lobby
    if (!player.currentLobbyId) {
      return { success: true }
    }

    const lobbyId = player.currentLobbyId

    const lobby = await this.lobbyRepository.getById(lobbyId)
    if (!lobby) {
      // Lobby doesn't exist but player thinks they're in it - fix the inconsistency
      player.setCurrentLobby(undefined)
      await this.playerRepository.update(player)
      return { success: true }
    }

    // Remove player from lobby
    lobby.removePlayer(username)

    // Update player first
    player.setCurrentLobby(undefined)
    await this.playerRepository.update(player)

    // If player was the host or last player, delete the lobby
    if (lobby.hostId === player.id || lobby.playerCount === 0) {
      await this.lobbyRepository.delete(lobbyId)
      return { success: true, lobbyDeleted: true }
    } else {
      // Otherwise update the lobby
      await this.lobbyRepository.update(lobby)
      return { success: true, lobbyDeleted: false }
    }
  }
}
