"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import {
  authService,
  SignInCredentials,
  SignUpCredentials,
  ConfirmSignUpRequest,
  ResetPasswordRequest,
  TopicsTokenResponse,
} from "../lib/auth-service";
import { userService } from "../lib/user-service";

interface User {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  topicsTokens: Record<string, TopicsTokenResponse>;
  username?: string;
  sub?: string;
  gameUsername?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  confirmSignUp: (request: ConfirmSignUpRequest) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (request: ResetPasswordRequest) => Promise<void>;
  signOut: () => void;
  getTopicsToken: (topic: string) => Promise<TopicsTokenResponse>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const TOKEN_KEY = "auth_tokens";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track ongoing token fetch operations to prevent duplicates
  const pendingTokenFetches = useRef<Record<string, boolean>>({});

  // Load user from localStorage on mount and handle token refresh if needed
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = localStorage.getItem(TOKEN_KEY);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser) as User;

          // Check if token is expired
          if (parsedUser.expiresAt > Date.now()) {
            setUser(parsedUser);
          } else {
            // Token expired, try to refresh
            try {
              console.log("Token expired, attempting to refresh...");
              const refreshResponse = await authService.refreshToken({
                refreshToken: parsedUser.refreshToken,
              });

              const expiresAt = Date.now() + refreshResponse.expiresIn * 1000;

              // Parse the JWT token to get the sub
              const tokenPayload = JSON.parse(
                atob(refreshResponse.idToken.split(".")[1])
              );
              const sub = tokenPayload.sub;

              // Update the user with the new tokens
              const updatedUser = {
                ...parsedUser,
                idToken: refreshResponse.idToken,
                accessToken: refreshResponse.accessToken,
                refreshToken: refreshResponse.refreshToken,
                expiresAt,
                sub,
              };

              // Save to localStorage
              localStorage.setItem(TOKEN_KEY, JSON.stringify(updatedUser));
              setUser(updatedUser);
              console.log("Successfully refreshed tokens");
            } catch (refreshError) {
              console.error("Failed to refresh tokens:", refreshError);
              // Clear user data if refresh fails
              localStorage.removeItem(TOKEN_KEY);
            }
          }
        }
      } catch (error) {
        console.error("Error loading user from localStorage:", error);
        // Clear potentially corrupted user data
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // We no longer fetch tokens on every idToken change
  // Instead, we fetch them only when the user signs in

  const signIn = async (credentials: SignInCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.signIn(credentials);
      const expiresAt = Date.now() + response.expiresIn * 1000;

      // Extract username from email for display purposes
      const username = credentials.email.split("@")[0];

      // Parse the JWT token to get the sub
      const tokenPayload = JSON.parse(atob(response.idToken.split(".")[1]));
      const sub = tokenPayload.sub;

      // Create the user object
      const userObject: User = {
        idToken: response.idToken,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt,
        topicsTokens: {},
        username,
        sub,
      };

      // Save to state and localStorage
      setUser(userObject);
      localStorage.setItem(TOKEN_KEY, JSON.stringify(userObject));

      // Fetch game username from /game/me
      try {
        const userInfo = await userService.getCurrentUser(response.idToken);
        if (userInfo.username) {
          userObject.gameUsername = userInfo.username;
          setUser(userObject);
          localStorage.setItem(TOKEN_KEY, JSON.stringify(userObject));
        }
      } catch (error) {
        console.error("Failed to fetch game username:", error);
      }

      // Fetch essential topics tokens once at login
      try {
        const importantTopics = ["lobby", "main-chat"];
        for (const topic of importantTopics) {
          try {
            console.log(`Prefetching token for topic: ${topic}`);
            const topicsResponse = await authService.getTopicsToken(
              topic,
              response.idToken
            );

            // Update the user object with the new token
            setUser((prevUser) => {
              if (!prevUser) return null;
              return {
                ...prevUser,
                topicsTokens: {
                  ...prevUser.topicsTokens,
                  [topic]: topicsResponse,
                },
              };
            });

            // Update in localStorage too
            const storedUser = localStorage.getItem(TOKEN_KEY);
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser) as User;
              parsedUser.topicsTokens = {
                ...parsedUser.topicsTokens,
                [topic]: topicsResponse,
              };
              localStorage.setItem(TOKEN_KEY, JSON.stringify(parsedUser));
            }

            console.log(`Successfully stored token for topic: ${topic}`);
          } catch (topicsError) {
            console.error(
              `Failed to fetch token for topic: ${topic}`,
              topicsError
            );
            // Continue with other topics even if one fails
          }
        }
      } catch (error) {
        console.error("Error prefetching topic tokens:", error);
        // Don't fail the sign in if token fetching fails
      }
    } catch (err) {
      console.error("Sign in error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to sign in";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (credentials: SignUpCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.signUp(credentials);
    } catch (err) {
      console.error("Sign up error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to sign up";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const confirmSignUp = async (request: ConfirmSignUpRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.confirmSignUp(request);
    } catch (err) {
      console.error("Confirm sign up error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to confirm sign up";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.forgotPassword(email);
    } catch (err) {
      console.error("Forgot password error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send reset code";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (request: ResetPasswordRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.resetPassword(request);
    } catch (err) {
      console.error("Reset password error:", err);
      setError(err instanceof Error ? err.message : "Failed to reset password");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    // Clear all tokens
    setUser(null);
    tokenCache.current = {};
    pendingTokenFetches.current = {};
    localStorage.removeItem(TOKEN_KEY);
  };

  // Cache used to store tokens during the current session to avoid duplicate API calls
  const tokenCache = useRef<Record<string, TopicsTokenResponse>>({});

  const getTopicsToken = async (
    topic: string,
    retryAttempt: number = 0
  ): Promise<TopicsTokenResponse> => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Helper function to check if a token is expired
    const isTokenExpired = (token: TopicsTokenResponse) => {
      const expiresAt = new Date(token.expiresAt).getTime();
      return expiresAt <= Date.now();
    };

    // First, check in-memory cache
    if (
      tokenCache.current[topic] &&
      !isTokenExpired(tokenCache.current[topic])
    ) {
      return tokenCache.current[topic];
    }

    // Then check if we already have a valid topics token in the user object
    if (
      user.topicsTokens &&
      user.topicsTokens[topic] &&
      !isTokenExpired(user.topicsTokens[topic])
    ) {
      // Store in our session cache and return
      tokenCache.current[topic] = user.topicsTokens[topic];
      return user.topicsTokens[topic];
    }

    // Check if we're already fetching this token
    if (pendingTokenFetches.current[topic]) {
      console.log(`Already fetching token for ${topic}, waiting...`);
      // Wait a bit and retry
      await new Promise((resolve) => setTimeout(resolve, 500));
      // If we're still fetching, wait more or continue
      if (pendingTokenFetches.current[topic]) {
        if (retryAttempt < 3) {
          return getTopicsToken(topic, retryAttempt + 1);
        }
      }
    }

    // Mark this token as being fetched
    pendingTokenFetches.current[topic] = true;

    try {
      // Fetch a new token if we don't have one or it's expired
      const response = await authService.getTopicsToken(topic, user.idToken);

      // Store in memory cache first
      tokenCache.current[topic] = response;

      // Update the user object with the new token
      setUser((prevUser) => {
        if (!prevUser) return null;

        return {
          ...prevUser,
          topicsTokens: {
            ...prevUser.topicsTokens,
            [topic]: response,
          },
        };
      });

      // Update in localStorage too to persist the token
      const storedUser = localStorage.getItem(TOKEN_KEY);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser) as User;
        parsedUser.topicsTokens = {
          ...parsedUser.topicsTokens,
          [topic]: response,
        };
        localStorage.setItem(TOKEN_KEY, JSON.stringify(parsedUser));
      }

      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to get topics token";
      console.error(`Failed to get topics token for ${topic}:`, errorMessage);

      // If this might be a token expiration issue and we haven't exceeded retry attempts
      if (retryAttempt < 1 && user?.refreshToken) {
        console.log("Attempting to refresh auth token and retry");
        try {
          // Try to refresh the authentication token first
          const refreshResponse = await authService.refreshToken({
            refreshToken: user.refreshToken,
          });

          const expiresAt = Date.now() + refreshResponse.expiresIn * 1000;

          // Parse the JWT token to get the sub
          const tokenPayload = JSON.parse(
            atob(refreshResponse.idToken.split(".")[1])
          );
          const sub = tokenPayload.sub;

          // Update user with new tokens
          setUser((prevUser) => {
            if (!prevUser) return null;

            return {
              ...prevUser,
              idToken: refreshResponse.idToken,
              accessToken: refreshResponse.accessToken,
              refreshToken: refreshResponse.refreshToken,
              expiresAt,
              sub,
            };
          });

          console.log(
            "Successfully refreshed auth tokens, retrying topics token fetch"
          );

          // Clear token cache for this topic
          delete tokenCache.current[topic];

          // Retry the topics token fetch with the new tokens
          // Small delay to ensure state update has completed
          await new Promise((resolve) => setTimeout(resolve, 100));
          return getTopicsToken(topic, retryAttempt + 1);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          setError("Your session has expired. Please sign in again.");
          signOut(); // Force logout on failed token refresh
          throw new Error("Authentication expired. Please sign in again.");
        }
      }

      setError(errorMessage);
      throw err;
    } finally {
      // Always clear the pending flag
      pendingTokenFetches.current[topic] = false;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    signIn,
    signUp,
    confirmSignUp,
    forgotPassword,
    resetPassword,
    signOut,
    getTopicsToken,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
