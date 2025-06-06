/**
 * API client for interacting with the backend
 */

// Use the proxy in development to avoid CORS issues
// Always use the proxy route to avoid CORS issues
const BASE_URL = "/api/proxy";

console.log(`API client using base URL: ${BASE_URL}`);

interface ApiOptions {
  method: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
  token?: string;
}

export async function api<T = any>(
  endpoint: string,
  options: ApiOptions
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (options.token) {
    headers["Authorization"] = options.token;
  }

  try {
    // Add timeout to fetch requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: options.method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text(); // Try to get text for better error logging
      let errorDetails = {};
      try {
        errorDetails = JSON.parse(errorBody);
      } catch (_) {
        // If parsing fails, use the raw text if available, or an empty object
        errorDetails = errorBody ? { rawError: errorBody } : {};
      }

      // Special handling for lobby join 500 errors
      if (endpoint === "/game/lobbies/join" && response.status === 500) {
        // Return a partial success response
        return {
          message: "Joined lobby with warnings",
          warning:
            (errorDetails as any).message ||
            (errorDetails as any).rawError ||
            "Server encountered an error",
        } as T;
      }

      throw new Error(
        (errorDetails as any).message ||
          (errorDetails as any).rawError ||
          `API Error: ${response.status}`
      );
    }

    // Handle 204 No Content specifically
    if (response.status === 204) {
      return { message: 'Success' } as T;
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      console.error(
        `Network connectivity issue or API server is down: ${endpoint}`
      );
      throw new Error(
        "Network connectivity issue. Please check your connection and try again."
      );
    } else if (error.name === "AbortError") {
      console.error(`Request timeout for endpoint: ${endpoint}`);
      throw new Error("Request timed out. Please try again later.");
    }

    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}
