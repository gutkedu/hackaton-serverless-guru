import { GenerateDisposableTopicsAuthTokenResponse } from '../topics/topics-dto.js'

export interface MomentoAuthProvider {
  generateDisposableTopicsAuthToken(cacheName: string): Promise<GenerateDisposableTopicsAuthTokenResponse>
}
