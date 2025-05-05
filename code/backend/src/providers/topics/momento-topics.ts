import { AuthClient, DisposableTokenScopes, ExpiresIn, GenerateDisposableTokenResponse } from '@gomomento/sdk'
import { TopicsProvider } from './topics-provider.js'
import { momentoAuthClient } from '@/shared/clients/momento-auth.js'
import { GenerateDisposableTopicsAuthTokenResponse } from './topics-dto.js'
import { getLogger } from '@/shared/logger/get-logger.js'
import { IntegrationError } from '@/shared/errors/integration-error.js'

const logger = getLogger()

export class MomentoTopicsProvider implements TopicsProvider {
  private apiKey: string
  private authClient: AuthClient
  private topicsCacheName: string

  constructor(apiKey: string, cacheName: string) {
    this.apiKey = apiKey
    this.topicsCacheName = cacheName
    this.authClient = momentoAuthClient(this.apiKey)
  }

  async generateDisposableTopicsAuthToken(): Promise<GenerateDisposableTopicsAuthTokenResponse> {
    try {
      const result = await this.authClient.generateDisposableToken(
        DisposableTokenScopes.topicPublishSubscribe('momento-cache', 'all-topics'),
        ExpiresIn.minutes(30)
      )
      switch (result.type) {
        case GenerateDisposableTokenResponse.Success:
          return {
            endpoint: result.endpoint,
            token: result.authToken,
            cacheName: this.topicsCacheName,
            expiresAt: new Date(result.expiresAt.epoch() * 1000)
          }
        case GenerateDisposableTokenResponse.Error:
          logger.error('Error generating disposable token', { error: result })
          throw new Error('Error generating disposable token')
      }
    } catch (error) {
      logger.error('Error generating disposable token', { error })
      throw new IntegrationError('Error generating disposable token')
    }
  }
}
