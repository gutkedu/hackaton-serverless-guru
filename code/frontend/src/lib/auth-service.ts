/**
 * Authentication service for handling user authentication flows
 */
import { api } from "./api";

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  username: string;
}

export interface AuthResponse {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ConfirmSignUpRequest {
  email: string;
  confirmationCode: string;
}

export interface ResetPasswordRequest {
  email: string;
  confirmationCode: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface TopicsTokenResponse {
  token: string;
  endpoint: string;
  cacheName: string;
  expiresAt: string;
}

class AuthService {
  /**
   * Sign in user and get tokens
   */
  async signIn(credentials: SignInCredentials): Promise<AuthResponse> {
    return api<AuthResponse>("/auth/signin", {
      method: "POST",
      body: credentials,
    });
  }

  /**
   * Sign up a new user
   */
  async signUp(credentials: SignUpCredentials): Promise<{ message: string }> {
    return api<{ message: string }>("/auth/signup", {
      method: "POST",
      body: credentials,
    });
  }

  /**
   * Confirm sign up with verification code
   */
  async confirmSignUp(
    request: ConfirmSignUpRequest
  ): Promise<{ message: string }> {
    return api<{ message: string }>("/auth/confirm-signup", {
      method: "POST",
      body: request,
    });
  }

  /**
   * Get topics token for a specific topic
   */
  async getTopicsToken(
    topic: string,
    idToken: string
  ): Promise<TopicsTokenResponse> {
    console.log(`Fetching topics token for topic: ${topic}`);
    const response = await api<TopicsTokenResponse>(
      `/auth/topics-token?topic=${topic}`,
      {
        method: "GET",
        token: idToken,
      }
    );
    console.log(
      `Successfully fetched topics token for ${topic} with expiration: ${response.expiresAt}`
    );
    return response;
  }

  /**
   * Refresh the authentication token
   */
  async refreshToken(request: RefreshTokenRequest): Promise<AuthResponse> {
    return api<AuthResponse>("/auth/refresh-token", {
      method: "POST",
      body: request,
    });
  }

  /**
   * Initiate forgot password flow
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    return api<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: { email },
    });
  }

  /**
   * Reset password with confirmation code
   */
  async resetPassword(
    request: ResetPasswordRequest
  ): Promise<{ message: string }> {
    return api<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: request,
    });
  }
}

export const authService = new AuthService();
