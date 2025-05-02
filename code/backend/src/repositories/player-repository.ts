import { PlayerEntity } from '@/entities/player'

export interface PlayerRepository {
  create(player: PlayerEntity): Promise<PlayerEntity>
}
