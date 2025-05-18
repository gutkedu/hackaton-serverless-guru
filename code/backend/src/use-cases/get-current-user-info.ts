import { PlayerRepository } from '@/repositories/player-repository.js'
import { BusinessError } from '@/shared/errors/business-error.js'
import { getLogger } from '@/shared/logger/get-logger.js'

interface GetCurrentUserInfoRequest {
  username: string
}

interface GetCurrentUserInfoResponse {
  id: string
  username: string
  email: string
  currentLobbyId?: string
  stats: {
    gamesPlayed: number
    wins: number
    bestWpm: number
    winRate: number
  }
  createdAt: string
  updatedAt: string
}

const logger = getLogger()

export class GetCurrentUserInfoUseCase {
  constructor(private playerRepository: PlayerRepository) {}

  async execute({ username }: GetCurrentUserInfoRequest): Promise<GetCurrentUserInfoResponse> {
    logger.info('GetCurrentUserInfoUseCase - Fetching user info', { username })

    const player = await this.playerRepository.getByUsername(username)

    if (!player) {
      logger.warn('GetCurrentUserInfoUseCase - Player not found', { username })
      throw new BusinessError('Player not found')
    }

    // Calculate win rate
    const winRate = player.gamesPlayed > 0 
      ? (player.wins / player.gamesPlayed) * 100 
      : 0

    return {
      id: player.id,
      username: player.username,
      email: player.email,
      currentLobbyId: player.currentLobbyId,
      stats: {
        gamesPlayed: player.gamesPlayed,
        wins: player.wins,
        bestWpm: player.bestWpm || 0,
        winRate: Math.round(winRate * 100) / 100 
      },
      createdAt: player.toJSON().createdAt || new Date().toISOString(),
      updatedAt: player.toJSON().updatedAt || new Date().toISOString()
    }
  }
}
