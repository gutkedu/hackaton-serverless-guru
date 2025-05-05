import { GenerateDisposableTopicsAuthTokenResponse } from './topics-dto.js'

export interface TopicsProvider {
  generateDisposableTopicsAuthToken(): Promise<GenerateDisposableTopicsAuthTokenResponse>
}
