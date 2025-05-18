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
    const player = await this.playerRepository.getByUsername(username)
    if (!player) {
      throw new IntegrationError('Player not found')
    }

    if (!player.currentLobbyId) {
      return { success: true }
    }

    const lobbyId = player.currentLobbyId

    const lobby = await this.lobbyRepository.getById(lobbyId)
    if (!lobby) {
      player.setCurrentLobby(undefined)
      await this.playerRepository.update(player)
      return { success: true }
    }

    lobby.removePlayer(username)

    player.setCurrentLobby(undefined)
    await this.playerRepository.update(player)

    if (lobby.hostId === player.id || lobby.playerCount === 0) {
      const lobby = await this.lobbyRepository.getById(lobbyId)
      if (lobby) {
        for (const player of lobby.playersUsernames || []) {
          const playerEntity = await this.playerRepository.getByUsername(player)
          if (playerEntity) {
            playerEntity.setCurrentLobby(undefined)
            await this.playerRepository.update(playerEntity)
          }
        }
        await this.lobbyRepository.delete(lobbyId)
      }
      return { success: true, lobbyDeleted: true }
    } else {
      await this.lobbyRepository.update(lobby)
      return { success: true, lobbyDeleted: false }
    }
  }
}
