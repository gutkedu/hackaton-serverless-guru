"use client";

import { useAuth } from "@/contexts/auth-context";
import { useCallback, useEffect, useState } from "react";

// Key for storing tokens in localStorage
const TOPICS_TOKENS_KEY = "topics_tokens";

/**
 * A hook for easily accessing topics tokens in components
 * Can either be used with manual fetching or with automatic prefetching
 * Tokens are now stored in localStorage for persistence
 */
export function useTopicsToken(defaultTopic: string = "lobby") {
  const { user, getTopicsToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cachedTokens, setCachedTokens] = useState<Record<string, string>>(
    () => {
      // Initialize from localStorage if available
      if (typeof window !== "undefined") {
        const storedTokens = localStorage.getItem(TOPICS_TOKENS_KEY);
        return storedTokens ? JSON.parse(storedTokens) : {};
      }
      return {};
    }
  );

  // Save cachedTokens to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined" && Object.keys(cachedTokens).length > 0) {
      localStorage.setItem(TOPICS_TOKENS_KEY, JSON.stringify(cachedTokens));
    }
  }, [cachedTokens]);

  // Automatically fetch essential tokens when the user is authenticated
  useEffect(() => {
    if (user) {
      const essentialTopics = ["lobby", "main-chat"];

      const fetchEssentialTokens = async () => {
        for (const topic of essentialTopics) {
          try {
            if (!cachedTokens[topic]) {
              console.log(`Auto-fetching token for ${topic}`);
              const token = await getTopicsToken(topic);
              setCachedTokens((prev) => ({
                ...prev,
                [topic]: token,
              }));
            }
          } catch (err) {
            console.error(`Failed to auto-fetch token for ${topic}:`, err);
          }
        }
      };

      fetchEssentialTokens();
    }
  }, [user, getTopicsToken, cachedTokens]);

  /**
   * Get a topics token for the specified topic, with built-in error handling
   * First checks the cache, then fetches if needed
   */
  const getToken = useCallback(
    async (topic: string = defaultTopic): Promise<string | null> => {
      // Return from cache if available
      if (cachedTokens[topic]) {
        return cachedTokens[topic];
      }

      setIsLoading(true);
      setError(null);

      try {
        const token = await getTopicsToken(topic);

        // Cache the token for future use
        setCachedTokens((prev) => ({
          ...prev,
          [topic]: token,
        }));

        return token;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get topics token";
        setError(errorMessage);
        console.error(`Topics token error (${topic}):`, errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [getTopicsToken, defaultTopic, cachedTokens]
  );

  return {
    getToken,
    cachedTokens,
    isLoading,
    error,
  };
}
