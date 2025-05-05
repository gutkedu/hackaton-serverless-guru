import { DynamoPlayerRepository } from '@/repositories/dynamodb/dynamo-player-repository.js'
import { SignUpPlayerUseCase } from '../signup-player.js'
import { CognitoProvider } from '@/providers/auth/cognito-provider.js'

export function makeSignUpPlayerUseCase(): SignUpPlayerUseCase {
  const playerRepository = new DynamoPlayerRepository()
  const authProvider = new CognitoProvider()
  return new SignUpPlayerUseCase(playerRepository, authProvider)
}
