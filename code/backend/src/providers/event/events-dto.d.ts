export enum EventType {
  UserPreSignUp = 'UserPreSignUp',
  UserPostConfirmation = 'UserPostConfirmation',
  UserPreAuthentication = 'UserPreAuthentication',
  UserPostAuthentication = 'UserPostAuthentication',
  UserTokenGeneration = 'UserTokenGeneration'
}

export const eventSource = 'auth.cognito'
