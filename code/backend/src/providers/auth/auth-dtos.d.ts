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
  refreshToken: string | undefined
}
