import { ApiError } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:7860/api/v1';

// In-memory access token storage (XSS resilient)
let inMemoryAccessToken: string | null = null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = () => inMemoryAccessToken;

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export class CustomHttpError extends Error {
  code: string;
  status: number;
  details?: Record<string, any>;

  constructor(status: number, errorData: ApiError) {
    super(errorData.message || 'API Request Failed');
    this.name = 'CustomHttpError';
    this.status = status;
    this.code = errorData.code || 'UNKNOWN_ERROR';
    this.details = errorData.details;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (!options.skipAuth && inMemoryAccessToken) {
    headers.set('Authorization', `Bearer ${inMemoryAccessToken}`);
  }

  const fetchConfig: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Ensures httpOnly refresh cookie is sent
  };

  let response: Response;
  try {
    response = await fetch(url, fetchConfig);
  } catch (netErr: any) {
    throw new CustomHttpError(0, {
      code: 'NETWORK_ERROR',
      message: 'Failed to connect to Chatgram server. Please check your internet connection.',
    });
  }

  // Handle transparent 401 Refresh and Retry
  if (response.status === 401 && !options.skipAuth && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    if (isRefreshing) {
      // Queue incoming requests while refresh is in flight
      return new Promise<T>((resolve, reject) => {
        failedQueue.push({
          resolve: (newToken: string) => {
            headers.set('Authorization', `Bearer ${newToken}`);
            resolve(apiClient<T>(endpoint, { ...options, headers }));
          },
          reject: (err: any) => {
            reject(err);
          },
        });
      });
    }

    isRefreshing = true;

    try {
      // Call refresh endpoint with credentials (cookie)
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!refreshRes.ok) {
        throw new Error('Refresh failed');
      }

      const refreshData = await refreshRes.json();
      const newToken = refreshData.access_token;
      setAccessToken(newToken);
      processQueue(null, newToken);

      // Retry original request
      headers.set('Authorization', `Bearer ${newToken}`);
      return apiClient<T>(endpoint, { ...options, headers });
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      setAccessToken(null);
      window.dispatchEvent(new Event('chatgram:logout'));
      throw new CustomHttpError(401, {
        code: 'SESSION_EXPIRED',
        message: 'Your session has expired. Please sign in again.',
      });
    } finally {
      isRefreshing = false;
    }
  }

  // Parse response
  let json: any = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      json = await response.json();
    } catch {
      json = null;
    }
  }

  if (!response.ok) {
    const errorData: ApiError = json?.error || {
      code: `HTTP_${response.status}`,
      message: json?.message || response.statusText || 'Request failed',
    };
    throw new CustomHttpError(response.status, errorData);
  }

  return json as T;
}

