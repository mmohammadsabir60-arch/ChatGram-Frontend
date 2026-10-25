import { apiClient } from './client';
import { FriendRequest, FriendRequestsListResponse, FriendItem } from '@/types';

export const friendsApi = {
  async sendRequest(username: string): Promise<FriendRequest> {
    return apiClient<FriendRequest>('/friends/requests', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  },

  async listRequests(direction?: 'incoming' | 'outgoing'): Promise<FriendRequestsListResponse> {
    const query = direction ? `?direction=${direction}` : '';
    return apiClient<FriendRequestsListResponse>(`/friends/requests${query}`);
  },

  async acceptRequest(requestId: string): Promise<FriendRequest> {
    return apiClient<FriendRequest>(`/friends/requests/${requestId}/accept`, {
      method: 'POST',
    });
  },

  async declineRequest(requestId: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>(`/friends/requests/${requestId}/decline`, {
      method: 'POST',
    });
  },

  async cancelRequest(requestId: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>(`/friends/requests/${requestId}`, {
      method: 'DELETE',
    });
  },

  async listFriends(): Promise<FriendItem[]> {
    return apiClient<FriendItem[]>('/friends');
  },

  async removeFriend(userId: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>(`/friends/${userId}`, {
      method: 'DELETE',
    });
  },

  async blockUser(userId: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>(`/blocks/${userId}`, {
      method: 'POST',
    });
  },

  async unblockUser(userId: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>(`/blocks/${userId}`, {
      method: 'DELETE',
    });
  },
};

