import { LobbyStatus } from '@/core/entities/lobby.js'
import { LobbyRepository } from '@/repositories/lobby-repository.js'
import { PlayerRepository } from '@/repositories/player-repository.js'
import { BusinessError } from '@/shared/errors/business-error.js'

interface ReturnToLobbyRequest {
  lobbyId: string
  username: string
}

interface ReturnToLobbyResponse {
  success: boolean
  lobby: {
    id: string
    name: string
    status: string
  }
}

export class ReturnToLobbyUseCase {
  constructor(private lobbyRepository: LobbyRepository, private playerRepository: PlayerRepository) {}

  async execute({ lobbyId, username }: ReturnToLobbyRequest): Promise<ReturnToLobbyResponse> {
    const lobby = await this.lobbyRepository.getById(lobbyId)
    if (!lobby) {
      throw new BusinessError('Lobby not found')
    }

    const player = await this.playerRepository.getByUsername(username)
    if (!player) {
      throw new BusinessError('Player not found')
    }

    // If player is already in this lobby, just return success
    if (player.currentLobbyId === lobbyId) {
      // Still update the status to OPEN since the game has ended
      if (lobby.status === LobbyStatus.IN_GAME) {
        lobby.setStatus(LobbyStatus.OPEN)
        await this.lobbyRepository.update(lobby)
      }

      return {
        success: true,
        lobby: {
          id: lobby.id,
          name: lobby.name,
          status: lobby.status
        }
      }
    }

    // If player is in another lobby, force leave that lobby first
    if (player.currentLobbyId && player.currentLobbyId !== lobbyId) {
      player.setCurrentLobby(undefined)
      await this.playerRepository.update(player)
    }

    // Add player to lobby if not already a member
    if (!lobby.playersUsernames?.includes(username)) {
      if (!lobby.addPlayer(username)) {
        throw new BusinessError('Failed to join lobby. It may be full.')
      }
    }

    // Set lobby status to OPEN if it was IN_GAME (game has ended)
    if (lobby.status === LobbyStatus.IN_GAME) {
      lobby.setStatus(LobbyStatus.OPEN)
    }

    // Update lobby with new player and potentially updated status
    await this.lobbyRepository.update(lobby)

    // Update player with new lobby
    player.setCurrentLobby(lobbyId)
    await this.playerRepository.update(player)

    return {
      success: true,
      lobby: {
        id: lobby.id,
        name: lobby.name,
        status: lobby.status
      }
    }
  }
}
