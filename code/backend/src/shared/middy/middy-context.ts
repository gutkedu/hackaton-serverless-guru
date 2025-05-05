import { Context } from 'aws-lambda'
import { MomentoSecretsDTO } from './secrets-dto.js'

export interface MiddyContext extends Context {
  momentoApiKeys: MomentoSecretsDTO
}
