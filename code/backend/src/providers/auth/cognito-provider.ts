import { getLogger } from '@/shared/logger/get-logger.js'
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  AuthFlowType,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  GetUserCommand
} from '@aws-sdk/client-cognito-identity-provider'
import { IntegrationError } from '@/shared/errors/integration-error.js'
import { cognito } from '@/shared/clients/cognito-client.js'
import { AuthProvider } from './auth-provider.js'
import { SignUpResult, SignInResult, RefreshTokenResult } from './auth-dtos.js'

const logger = getLogger()

export class CognitoProvider implements AuthProvider {
  private client: CognitoIdentityProviderClient
  private userPoolClientId: string

  constructor(userPoolClientId?: string) {
    if (!userPoolClientId && !process.env.USER_POOL_CLIENT_ID) {
      throw new Error('Cognito User Pool Client ID is required')
    }

    this.userPoolClientId = userPoolClientId || process.env.USER_POOL_CLIENT_ID!
    this.client = cognito()
  }

  async signUp(email: string, password: string, attributes?: Record<string, string>): Promise<SignUpResult> {
    try {
      const userAttributes = Object.entries(attributes || {}).map(([key, value]) => ({
        Name: key,
        Value: value
      }))

      // Always include email as an attribute
      if (!userAttributes.some((attr) => attr.Name === 'email')) {
        userAttributes.push({
          Name: 'email',
          Value: email
        })
      }

      const command = new SignUpCommand({
        ClientId: this.userPoolClientId,
        Username: email,
        Password: password,
        UserAttributes: userAttributes
      })

      const result = await this.client.send(command)

      logger.info('User signed up successfully', { email })

      return {
        userSub: result.UserSub!,
        userConfirmed: result.UserConfirmed || false
      }
    } catch (error) {
      logger.error('Error signing up user', { error, email })
      throw new IntegrationError(`Failed to sign up user: ${(error as Error).message}`)
    }
  }

  async confirmSignUp(email: string, confirmationCode: string): Promise<void> {
    try {
      const command = new ConfirmSignUpCommand({
        ClientId: this.userPoolClientId,
        Username: email,
        ConfirmationCode: confirmationCode
      })

      await this.client.send(command)

      logger.info('User confirmation successful', { email })
    } catch (error) {
      logger.error('Error confirming user signup', { error, email })
      throw new IntegrationError(`Failed to confirm user: ${(error as Error).message}`)
    }
  }

  async signIn(email: string, password: string): Promise<SignInResult> {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        UserContextData: {},
        ClientId: this.userPoolClientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password
        }
      })

      const { AuthenticationResult } = await this.client.send(command)
      logger.info('User signed in successfully', { email })

      return {
        idToken: AuthenticationResult?.IdToken,
        accessToken: AuthenticationResult?.AccessToken,
        refreshToken: AuthenticationResult?.RefreshToken,
        expiresIn: AuthenticationResult?.ExpiresIn
      }
    } catch (error) {
      logger.error('Error signing in user', { error, email })
      throw new IntegrationError(`Failed to sign in user: ${(error as Error).message}`)
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      const command = new ForgotPasswordCommand({
        ClientId: this.userPoolClientId,
        Username: email
      })

      await this.client.send(command)
      logger.info('Password reset initiated', { email })
    } catch (error) {
      logger.error('Error initiating password reset', { error, email })
      throw new IntegrationError(`Failed to initiate password reset: ${(error as Error).message}`)
    }
  }

  async confirmForgotPassword(email: string, confirmationCode: string, newPassword: string): Promise<void> {
    try {
      const command = new ConfirmForgotPasswordCommand({
        ClientId: this.userPoolClientId,
        Username: email,
        ConfirmationCode: confirmationCode,
        Password: newPassword
      })

      await this.client.send(command)
      logger.info('Password reset successful', { email })
    } catch (error) {
      logger.error('Error resetting password', { error, email })
      throw new IntegrationError(`Failed to reset password: ${(error as Error).message}`)
    }
  }

  async getUser(accessToken: string): Promise<{
    username: string | undefined
    attributes: Record<string, string | undefined>
  }> {
    try {
      const command = new GetUserCommand({
        AccessToken: accessToken
      })

      const result = await this.client.send(command)

      const attributes =
        result.UserAttributes?.reduce((acc, attr) => {
          if (attr.Name && attr.Value) {
            acc[attr.Name] = attr.Value
          }
          return acc
        }, {} as Record<string, string>) || {}

      return {
        username: result.Username,
        attributes
      }
    } catch (error) {
      logger.error('Error getting user info', { error })
      throw new IntegrationError(`Failed to get user info: ${(error as Error).message}`)
    }
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResult> {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
        ClientId: this.userPoolClientId,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken
        }
      })

      const result = await this.client.send(command)
      logger.info('Token refreshed successfully')

      return {
        idToken: result.AuthenticationResult?.IdToken,
        accessToken: result.AuthenticationResult?.AccessToken,
        expiresIn: result.AuthenticationResult?.ExpiresIn,
        refreshToken: result.AuthenticationResult?.RefreshToken
      }
    } catch (error) {
      logger.error('Error refreshing token', { error })
      throw new IntegrationError(`Failed to refresh token: ${(error as Error).message}`)
    }
  }
}
