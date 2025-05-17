"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  authService,
  SignInCredentials,
  SignUpCredentials,
  AuthResponse,
  ConfirmSignUpRequest,
  ResetPasswordRequest,
} from "../lib/auth-service";

interface User {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  topicsTokens: Record<string, { token: string; expiresAt: number }>;
  username?: string;
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
  getTopicsToken: (topic: string) => Promise<string>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const TOKEN_KEY = "auth_tokens";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem(TOKEN_KEY);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser) as User;

          // Check if token is expired
          if (parsedUser.expiresAt > Date.now()) {
            setUser(parsedUser);
          } else {
            // Token expired, try to refresh or logout
            localStorage.removeItem(TOKEN_KEY);
            // Could implement token refresh here
          }
        }
      } catch (error) {
        console.error("Failed to load auth state:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(user));
    }
  }, [user]);

  // Helper function to fetch topic tokens
  const fetchEssentialTopicsTokens = async (userObj: User) => {
    const essentialTopics = ["lobby", "main-chat"];
    for (const topic of essentialTopics) {
      try {
        console.log(`Fetching token for topic: ${topic}`);
        const topicsResponse = await authService.getTopicsToken(
          topic,
          userObj.idToken
        );
        const topicsExpiresAt = Date.now() + topicsResponse.expiration * 1000;

        // Update the user state with the new token
        setUser((prevUser) => {
          if (!prevUser) return userObj;

          return {
            ...prevUser,
            topicsTokens: {
              ...prevUser.topicsTokens,
              [topic]: {
                token: topicsResponse.token,
                expiresAt: topicsExpiresAt,
              },
            },
          };
        });

        console.log(`Successfully stored token for topic: ${topic}`);
      } catch (topicsError) {
        console.error(`Failed to fetch token for topic: ${topic}`, topicsError);
        // Continue trying other topics even if one fails
      }
    }
  };

  const signIn = async (credentials: SignInCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.signIn(credentials);
      const expiresAt = Date.now() + response.expiresIn * 1000;

      // Extract username from email for display purposes
      const username = credentials.email.split("@")[0];

      // Create the user object
      const userObject: User = {
        idToken: response.idToken,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt,
        topicsTokens: {},
        username, // Add username
      };

      // Set the user object immediately to improve perceived performance
      setUser(userObject);

      // Fetch tokens for essential topics in a non-blocking way
      setTimeout(() => {
        fetchEssentialTopicsTokens(userObject);
      }, 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
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
      setError(err instanceof Error ? err.message : "Failed to sign up");
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
      setError(
        err instanceof Error ? err.message : "Failed to confirm sign up"
      );
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
      setError(
        err instanceof Error
          ? err.message
          : "Failed to process forgot password request"
      );
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
      setError(err instanceof Error ? err.message : "Failed to reset password");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
  };

  const getTopicsToken = async (topic: string): Promise<string> => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Check if we already have a valid topics token in memory
    if (
      user.topicsTokens &&
      user.topicsTokens[topic] &&
      user.topicsTokens[topic].expiresAt > Date.now()
    ) {
      // Return cached token if it's still valid
      return user.topicsTokens[topic].token;
    }

    try {
      // Fetch a new token if we don't have one or it's expired
      const response = await authService.getTopicsToken(topic, user.idToken);
      const topicsExpiresAt = Date.now() + response.expiration * 1000;

      // Update the user object with the new token
      setUser((prevUser) => {
        if (!prevUser) return null;

        return {
          ...prevUser,
          topicsTokens: {
            ...prevUser.topicsTokens,
            [topic]: {
              token: response.token,
              expiresAt: topicsExpiresAt,
            },
          },
        };
      });

      return response.token;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get topics token"
      );
      throw err;
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
