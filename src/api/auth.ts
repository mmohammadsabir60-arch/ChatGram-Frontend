import { apiClient, setAccessToken } from './client';
import { AuthResponse, User } from '@/types';

export const authApi = {
  async register(params: { username: string; password: string; display_name?: string }): Promise<AuthResponse> {
    const data = await apiClient<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(params),
      skipAuth: true,
    });
    setAccessToken(data.access_token);
    return data;
  },

  async login(params: { username: string; password: string }): Promise<AuthResponse> {
    const data = await apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(params),
      skipAuth: true,
    });
    setAccessToken(data.access_token);
    return data;
  },

  async refresh(): Promise<AuthResponse> {
    const data = await apiClient<AuthResponse>('/auth/refresh', {
      method: 'POST',
      skipAuth: true,
    });
    setAccessToken(data.access_token);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient<{ message: string }>('/auth/logout', {
        method: 'POST',
      });
    } finally {
      setAccessToken(null);
    }
  },

  async getMe(): Promise<User> {
    return apiClient<User>('/users/me');
  },

  async updateMe(params: { display_name?: string | null; bio?: string | null }): Promise<User> {
    return apiClient<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  },
};

