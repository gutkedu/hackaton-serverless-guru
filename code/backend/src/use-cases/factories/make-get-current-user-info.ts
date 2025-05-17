import { DynamoPlayerRepository } from '@/repositories/dynamodb/dynamo-player-repository.js'
import { GetCurrentUserInfoUseCase } from '../get-current-user-info.js'

export function makeGetCurrentUserInfoUseCase(): GetCurrentUserInfoUseCase {
  const playerRepository = new DynamoPlayerRepository()
  return new GetCurrentUserInfoUseCase(playerRepository)
}
