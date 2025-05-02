export interface SignUpResult {
  userSub: string
  userConfirmed: boolean
}

export interface SignInResult {
  idToken: string | undefined
  accessToken: string | undefined
  refreshToken: string | undefined
  expiresIn: number | undefined
}

export interface RefreshTokenResult {
  idToken: string | undefined
  accessToken: string | undefined
  expiresIn: number | undefined
}

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
