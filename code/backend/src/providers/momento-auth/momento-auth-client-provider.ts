import {
  AllTopics,
  AuthClient,
  DisposableTokenScopes,
  ExpiresIn,
  GenerateDisposableTokenResponse
} from '@gomomento/sdk'
import { momentoAuthClient } from '@/shared/clients/momento-auth.js'
import { GenerateDisposableTopicsAuthTokenResponse } from '../topics/topics-dto.js'
import { getLogger } from '@/shared/logger/get-logger.js'
import { IntegrationError } from '@/shared/errors/integration-error.js'
import { MomentoAuthProvider } from './momento-auth-provider.js'

const logger = getLogger()

export class MomentoAuthClientProvider implements MomentoAuthProvider {
  private authClient: AuthClient

  constructor(apiKey: string) {
    this.authClient = momentoAuthClient(apiKey)
  }

  async generateDisposableTopicsAuthToken(cacheName: string): Promise<GenerateDisposableTopicsAuthTokenResponse> {
    try {
      const result = await this.authClient.generateDisposableToken(
        DisposableTokenScopes.topicPublishSubscribe(cacheName, AllTopics),
        ExpiresIn.minutes(30)
      )
      switch (result.type) {
        case GenerateDisposableTokenResponse.Success:
          return {
            endpoint: result.endpoint,
            token: result.authToken,
            cacheName: cacheName,
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
