import { apiClient } from './client';
import {
  Conversation,
  MessagesListResponse,
  WsTicketResponse
} from '@/types';

export const chatApi = {
  async listConversations(): Promise<Conversation[]> {
    return apiClient<Conversation[]>('/conversations');
  },

  async createConversation(userId: string): Promise<Conversation> {
    return apiClient<Conversation>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  },

  async getMessages(
    conversationId: string,
    before?: number | null,
    limit: number = 30
  ): Promise<MessagesListResponse> {
    const params = new URLSearchParams();
    if (before) params.set('before', before.toString());
    if (limit) params.set('limit', limit.toString());

    return apiClient<MessagesListResponse>(
      `/conversations/${conversationId}/messages?${params.toString()}`
    );
  },

  async markAsRead(conversationId: string): Promise<{ conversation_id: string; last_read_message_id: number }> {
    return apiClient<{ conversation_id: string; last_read_message_id: number }>(
      `/conversations/${conversationId}/read`,
      { method: 'POST' }
    );
  },

  async deleteMessage(messageId: number, scope: 'me' | 'all'): Promise<{ message: string; scope: string }> {
    return apiClient<{ message: string; scope: string }>(
      `/messages/${messageId}?scope=${scope}`,
      { method: 'DELETE' }
    );
  },

  async getWsTicket(): Promise<WsTicketResponse> {
    return apiClient<WsTicketResponse>('/ws/ticket', {
      method: 'POST',
    });
  },
};

