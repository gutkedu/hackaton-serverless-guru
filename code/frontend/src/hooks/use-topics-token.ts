"use client";

import { useAuth } from "@/contexts/auth-context";
import { useCallback, useRef, useState } from "react";

// Note: We're now relying solely on the auth context to manage tokens
// and are not using localStorage directly in this hook

/**
 * A hook for easily accessing topics tokens in components
 * Can either be used with manual fetching or with automatic prefetching
 * Tokens are now stored in localStorage for persistence
 */
export function useTopicsToken(defaultTopic: string = "lobby") {
  const { user, getTopicsToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track ongoing token fetch requests to prevent duplicates
  const pendingFetches = useRef<Record<string, boolean>>({});

  // Note: We're removing the separate cachedTokens state since all tokens are now
  // managed in the auth context and we were having sync issues between the two

  // We no longer automatically fetch tokens on every idToken change
  // Tokens will be fetched on demand through getToken
  // Initial token fetch is handled in the auth context when user signs in

  /**
   * Get a topics token for the specified topic, with built-in error handling
   * First checks the cache, then fetches if needed
   */
  // Keep track of tokens that have already been fetched during this session
  const tokenRequestsMade = useRef<Record<string, boolean>>({});

  const getToken = useCallback(
    async (topic: string = defaultTopic): Promise<string | null> => {
      const currentTopic = topic || defaultTopic;

      // Use existing token if available and valid
      if (
        user?.topicsTokens &&
        user.topicsTokens[currentTopic] &&
        user.topicsTokens[currentTopic].expiresAt > Date.now()
      ) {
        // Log only the first time we use the cached token
        if (!tokenRequestsMade.current[currentTopic]) {
          console.log(`Using cached token for ${currentTopic}`);
          tokenRequestsMade.current[currentTopic] = true;
        }
        return user.topicsTokens[currentTopic].token;
      }

      // Skip if we're already fetching this token
      if (pendingFetches.current[currentTopic]) {
        console.log(`Already fetching token for ${currentTopic}, waiting...`);
        // Wait for the existing request to complete
        await new Promise((resolve) => setTimeout(resolve, 500));
        return getToken(currentTopic);
      }

      setIsLoading(true);
      setError(null);
      pendingFetches.current[currentTopic] = true;
      
      try {
        console.log(`Fetching token for topic: ${currentTopic}`);
        const token = await getTopicsToken(currentTopic);
        tokenRequestsMade.current[currentTopic] = true;

        if (!token) {
          throw new Error("Failed to get a valid token");
        }

        console.log(`Successfully fetched token for topic: ${currentTopic}`);
        return token;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get topics token";
        setError(errorMessage);
        console.error(`Topics token error (${currentTopic}):`, errorMessage);
        return null;
      } finally {
        setIsLoading(false);
        pendingFetches.current[currentTopic] = false;
      }
    },
    [getTopicsToken, defaultTopic, user]
  );

  return {
    getToken,
    isLoading,
    error,
  };
}
