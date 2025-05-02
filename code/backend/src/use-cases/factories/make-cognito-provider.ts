import { CognitoProvider } from '@/providers/auth/cognito-provider'
import { AuthProvider } from '@/providers/auth/auth-provider'

export function makeCognitoProvider(): AuthProvider {
  return new CognitoProvider()
}
