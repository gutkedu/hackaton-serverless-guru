/**
 * API client for interacting with the backend
 */

const BASE_URL = "https://gz8ep2fj9g.execute-api.us-east-1.amazonaws.com/api";

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

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: options.method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  return response.json();
}
