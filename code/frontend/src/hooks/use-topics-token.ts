"use client";

import { useAuth } from "@/contexts/auth-context";
import { useCallback, useRef, useState } from "react";
import { TopicsTokenResponse } from "@/lib/auth-service";

export function useTopicsToken(defaultTopic: string = "lobby") {
  const { user, getTopicsToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track ongoing token fetch requests to prevent duplicates
  const pendingFetches = useRef<Record<string, boolean>>({});

  /**
   * Get a topics token for the specified topic, with built-in error handling
   * First checks the cache, then fetches if needed
   */
  // Keep track of tokens that have already been fetched during this session
  const tokenRequestsMade = useRef<Record<string, boolean>>({});

  const getToken = useCallback(
    async (
      topic: string = defaultTopic
    ): Promise<TopicsTokenResponse | null> => {
      const currentTopic = topic || defaultTopic;

      // Helper function to check if a token is expired
      const isTokenExpired = (token: TopicsTokenResponse) => {
        const expiresAt = new Date(token.expiresAt).getTime();
        return expiresAt <= Date.now();
      };

      // Use existing token if available and valid
      if (
        user?.topicsTokens &&
        user.topicsTokens[currentTopic] &&
        !isTokenExpired(user.topicsTokens[currentTopic])
      ) {
        // Log only the first time we use the cached token
        if (!tokenRequestsMade.current[currentTopic]) {
          console.log(`Using cached token for ${currentTopic}`);
          tokenRequestsMade.current[currentTopic] = true;
        }
        return user.topicsTokens[currentTopic];
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
        const tokenResponse = await getTopicsToken(currentTopic);
        tokenRequestsMade.current[currentTopic] = true;

        if (!tokenResponse) {
          throw new Error("Failed to get a valid token");
        }

        console.log(`Successfully fetched token for topic: ${currentTopic}`);
        return tokenResponse;
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
