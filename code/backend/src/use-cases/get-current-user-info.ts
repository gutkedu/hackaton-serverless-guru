import { PlayerRepository } from '@/repositories/player-repository.js'
import { BusinessError } from '@/shared/errors/business-error.js'

interface GetCurrentUserInfoRequest {
  username: string
}

interface GetCurrentUserInfoResponse {
  id: string
  username: string
  email: string
  currentLobbyId?: string
}

export class GetCurrentUserInfoUseCase {
  constructor(private playerRepository: PlayerRepository) {}

  async execute({ username }: GetCurrentUserInfoRequest): Promise<GetCurrentUserInfoResponse> {
    const player = await this.playerRepository.getByUsername(username)

    if (!player) {
      throw new BusinessError('Player not found')
    }

    return {
      id: player.id,
      username: player.username,
      email: player.email,
      currentLobbyId: player.currentLobbyId
    }
  }
}
