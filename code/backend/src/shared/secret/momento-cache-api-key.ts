import { getSecret } from '@aws-lambda-powertools/parameters/secrets'
import { IntegrationError } from '../errors/integration-error.js'
import { getLogger } from '../logger/get-logger.js'
import { MomentoSecretsDTO } from './secrets-dto.js'

const logger = getLogger()

export async function getMomentoCacheApiKey(): Promise<string> {
  const momentoApiKeys = (await getSecret('MOMENTO_API_KEYS', {
    maxAge: 3600,
    transform: 'json'
  })) as MomentoSecretsDTO

  const momentoApiKey = momentoApiKeys.MOMENTO_CACHE_API_KEY

  if (!momentoApiKey) {
    logger.error('MOMENTO_CACHE_API_KEY not found in secret')
    throw new IntegrationError('MOMENTO_CACHE_API_KEY not found in secret')
  }

  logger.info('Retrieved Momento secret', {
    hasApiKey: Boolean(momentoApiKey),
    apiKeyLength: momentoApiKey?.length
  })

  return momentoApiKey
}
