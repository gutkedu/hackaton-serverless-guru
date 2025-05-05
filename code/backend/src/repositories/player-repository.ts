import { PlayerEntity } from '@/entities/player.js'

export interface PlayerRepository {
  create(player: PlayerEntity): Promise<PlayerEntity>
  update(player: PlayerEntity): Promise<PlayerEntity>
  getByUsername(username: string): Promise<PlayerEntity | null>
  getPlayersInLobby(lobbyId: string): Promise<PlayerEntity[]>
  getByEmail(email: string): Promise<PlayerEntity | null>
}
