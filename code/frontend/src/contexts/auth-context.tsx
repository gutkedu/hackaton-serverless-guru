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
              
              // Update user with new tokens
              const refreshedUser = {
                ...parsedUser,
                idToken: refreshResponse.idToken,
                accessToken: refreshResponse.accessToken,
                refreshToken: refreshResponse.refreshToken,
                expiresAt,
                // Reset topic tokens since they would also be expired
                topicsTokens: {},
              };
              
              setUser(refreshedUser);
              console.log("Successfully refreshed authentication token");
              
              // Fetch new topic tokens after successful refresh
              setTimeout(() => {
                fetchEssentialTopicsTokens(refreshedUser);
              }, 0);
            } catch (refreshError) {
              console.error("Failed to refresh token:", refreshError);
              // Token refresh failed, force logout
              localStorage.removeItem(TOKEN_KEY);
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load auth state:", error);
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
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

  const getTopicsToken = async (topic: string, retryAttempt: number = 0): Promise<string> => {
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
      const errorMessage = err instanceof Error ? err.message : "Failed to get topics token";
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
          
          // Update user with new tokens
          setUser((prevUser) => {
            if (!prevUser) return null;
            
            return {
              ...prevUser,
              idToken: refreshResponse.idToken,
              accessToken: refreshResponse.accessToken,
              refreshToken: refreshResponse.refreshToken,
              expiresAt,
            };
          });
          
          console.log("Successfully refreshed auth token, retrying topics token fetch");
          
          // Retry the topics token fetch with the new ID token
          // Small delay to ensure state update has completed
          await new Promise(resolve => setTimeout(resolve, 100));
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
