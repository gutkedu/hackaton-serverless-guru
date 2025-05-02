import { CognitoProvider } from '@/providers/auth/cognito-provider.js'
import { AuthProvider } from '@/providers/auth/auth-provider.js'

export function makeCognitoProvider(): AuthProvider {
  return new CognitoProvider()
}
