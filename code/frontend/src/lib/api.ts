/**
 * API client for interacting with the backend
 */

// Use the proxy in development to avoid CORS issues
const DIRECT_API_URL =
  "https://gz8ep2fj9g.execute-api.us-east-1.amazonaws.com/api";
const PROXY_API_URL = "/api/proxy"; // Local proxy to avoid CORS issues

// Use proxy in development mode and direct in production
const isDev = process.env.NODE_ENV === "development";
const BASE_URL = isDev ? PROXY_API_URL : DIRECT_API_URL;

console.log(
  `API client using ${
    isDev ? "proxy" : "direct"
  } mode with base URL: ${BASE_URL}`
);

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
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API Error: ${response.status}`);
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
