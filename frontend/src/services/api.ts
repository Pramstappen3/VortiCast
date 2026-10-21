/**
 * Centralized API Client for VortiCast.
 * Configured via environment variables with graceful fallback to mock layer
 * when the backend server is offline or in demonstration mode.
 */

export interface ApiClientConfig {
  baseUrl: string;
  useMock: boolean;
  timeoutMs: number;
}

const getEnvConfig = (): ApiClientConfig => {
  const envBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const envUseMock = import.meta.env.VITE_USE_MOCK_DATA;

  return {
    baseUrl: envBaseUrl || 'http://localhost:8000/api/v1',
    // Default to true if not explicitly set to 'false'
    useMock: envUseMock !== 'false',
    timeoutMs: 8000,
  };
};

export const apiConfig = getEnvConfig();

export class ApiError extends Error {
  status?: number;
  code?: string;
  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Standard HTTP GET wrapper with timeout and fallback
 */
export async function apiGet<T>(endpoint: string, fallbackMockData?: T): Promise<T> {
  // If explicitly configured for mock data, return mock immediately
  if (apiConfig.useMock && fallbackMockData !== undefined) {
    // Simulate brief network latency for realistic UX
    await new Promise((resolve) => setTimeout(resolve, 150));
    return fallbackMockData;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), apiConfig.timeoutMs);

  try {
    const url = `${apiConfig.baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new ApiError(
        `Backend request failed with status: ${response.status} ${response.statusText}`,
        response.status
      );
    }

    return (await response.json()) as T;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    
    // If backend is unavailable or times out, gracefully use mock data if supplied
    if (fallbackMockData !== undefined) {
      console.warn(
        `[VortiCast API Client] Backend request to ${endpoint} failed. Falling back to demonstration dataset.`,
        err
      );
      return fallbackMockData;
    }

    if (err instanceof Error) {
      throw new ApiError(err.message, undefined, 'NETWORK_ERROR');
    }
    throw new ApiError('An unknown network error occurred', undefined, 'UNKNOWN_ERROR');
  }
}
