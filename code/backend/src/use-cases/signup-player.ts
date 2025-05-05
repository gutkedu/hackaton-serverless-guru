import { PlayerEntity } from '@/entities/player.js'
import { AuthProvider } from '@/providers/auth/auth-provider.js'
import { PlayerRepository } from '@/repositories/player-repository.js'

interface SignUpPlayerRequest {
  username: string
  email: string
  password: string
}

interface SignUpPlayerResponse {
  playerId: string
  username: string
  userConfirmed: boolean
}

export class SignUpPlayerUseCase {
  constructor(private playerRepository: PlayerRepository, private authProvider: AuthProvider) {}

  async execute({ username, email, password }: SignUpPlayerRequest): Promise<SignUpPlayerResponse> {
    const existingPlayer = await this.playerRepository.getByUsername(username)
    if (existingPlayer) {
      throw new Error('Player already exists for this username')
    }

    const { userConfirmed, userSub } = await this.authProvider.signUp(email, password, {
      preferred_username: username
    })

    // Create a new player
    const player = PlayerEntity.create({
      id: userSub,
      email,
      username,
      userConfirmed
    })

    await this.playerRepository.create(player)

    return {
      playerId: player.id,
      username: player.username,
      userConfirmed: player.userConfirmed
    }
  }
}
