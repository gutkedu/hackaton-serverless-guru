import { SignUpResult, SignInResult, RefreshTokenResult } from './auth-dtos.js'

export interface AuthProvider {
  signUp(email: string, password: string, attributes?: Record<string, string>): Promise<SignUpResult>
  confirmSignUp(email: string, confirmationCode: string): Promise<void>
  signIn(email: string, password: string): Promise<SignInResult>
  refreshToken(refreshToken: string): Promise<RefreshTokenResult>
  forgotPassword(email: string): Promise<void>
  confirmForgotPassword(email: string, confirmationCode: string, newPassword: string): Promise<void>
  getUser(accessToken: string): Promise<{
    username: string | undefined
    attributes: Record<string, string | undefined>
  }>
}
