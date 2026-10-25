import { apiClient } from './client';
import { UserSearchResponse } from '@/types';

export const usersApi = {
  async searchUsers(query: string, cursor?: string | null, limit: number = 20): Promise<UserSearchResponse> {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (cursor) params.set('cursor', cursor);
    if (limit) params.set('limit', limit.toString());

    return apiClient<UserSearchResponse>(`/users/search?${params.toString()}`);
  },
};

