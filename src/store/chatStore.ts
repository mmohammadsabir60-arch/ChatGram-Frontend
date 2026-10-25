import { create } from 'zustand';
import { Conversation, Message } from '@/types';
import { chatApi } from '@/api/chat';
import { socketService } from '@/ws/socket';
import { useAuthStore } from './authStore';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  typingUsers: Record<string, Set<string>>;
  hasMore: Record<string, boolean>;
  oldestCursor: Record<string, number | null>;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;

  setActiveConversation: (id: string | null) => void;
  fetchConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  loadOlderMessages: (conversationId: string) => Promise<void>;
  sendMessageOptimistic: (conversationId: string, body: string) => void;
  markConversationAsRead: (conversationId: string) => Promise<void>;

  // Socket event handlers
  handleMessageAck: (data: { client_id: string; message_id: number; conversation_id: string; status: string; created_at: string }) => void;
  handleNewMessage: (data: any) => void;
  handleMessageDelivered: (data: { message_id: number; conversation_id: string }) => void;
  handleMessageSeen: (data: { conversation_id: string; user_id: string; last_read_message_id: number }) => void;
  handleMessageDeleted: (data: { message_id: number; conversation_id: string; scope: string }) => void;
  handleTyping: (data: { conversation_id: string; user_id: string; is_typing: boolean }) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  typingUsers: {},
  hasMore: {},
  oldestCursor: {},
  isLoadingConversations: false,
  isLoadingMessages: false,

  setActiveConversation: (id) => {
    set({ activeConversationId: id });
    if (id) {
      get().loadMessages(id);
      get().markConversationAsRead(id);
    }
  },

  fetchConversations: async () => {
    try {
      set({ isLoadingConversations: true });
      const convs = await chatApi.listConversations();
      set({ conversations: convs, isLoadingConversations: false });
    } catch {
      set({ isLoadingConversations: false });
    }
  },

  loadMessages: async (conversationId: string) => {
    try {
      set({ isLoadingMessages: true });
      const res = await chatApi.getMessages(conversationId, null, 30);
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: res.items,
        },
        hasMore: {
          ...state.hasMore,
          [conversationId]: res.has_more,
        },
        oldestCursor: {
          ...state.oldestCursor,
          [conversationId]: res.next_cursor || null,
        },
        isLoadingMessages: false,
      }));
    } catch {
      set({ isLoadingMessages: false });
    }
  },

  loadOlderMessages: async (conversationId: string) => {
    const cursor = get().oldestCursor[conversationId];
    const canLoad = get().hasMore[conversationId];
    if (!cursor || !canLoad) return;

    try {
      const res = await chatApi.getMessages(conversationId, cursor, 30);
      set((state) => {
        const existing = state.messages[conversationId] || [];
        return {
          messages: {
            ...state.messages,
            [conversationId]: [...res.items, ...existing],
          },
          hasMore: {
            ...state.hasMore,
            [conversationId]: res.has_more,
          },
          oldestCursor: {
            ...state.oldestCursor,
            [conversationId]: res.next_cursor || null,
          },
        };
      });
    } catch {
      // Failed to load older messages
    }
  },

  sendMessageOptimistic: (conversationId: string, body: string) => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return;

    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const optimisticMessage: Message = {
      id: -Date.now(), // temporary negative ID
      conversation_id: conversationId,
      sender_id: currentUser.id,
      body,
      client_id: clientId,
      created_at: new Date().toISOString(),
      deleted_for_sender: false,
      deleted_for_all: false,
      is_mine: true,
      status: 'sending',
    };

    set((state) => {
      const currentList = state.messages[conversationId] || [];
      const updatedConversations = state.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, last_message: optimisticMessage, last_message_at: optimisticMessage.created_at }
          : c
      );

      return {
        messages: {
          ...state.messages,
          [conversationId]: [...currentList, optimisticMessage],
        },
        conversations: updatedConversations,
      };
    });

    // Transmit over WebSocket
    socketService.send('message.send', {
      conversation_id: conversationId,
      body,
      client_id: clientId,
    });
  },

  markConversationAsRead: async (conversationId: string) => {
    try {
      await chatApi.markAsRead(conversationId);
      socketService.send('message.read', { conversation_id: conversationId });
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === conversationId ? { ...c, unread_count: 0 } : c
        ),
      }));
    } catch {
      // ignore
    }
  },

  handleMessageAck: (data) => {
    set((state) => {
      const list = state.messages[data.conversation_id] || [];
      const updatedList = list.map((m) => {
        if (m.client_id === data.client_id) {
          return {
            ...m,
            id: data.message_id,
            status: 'sent' as const,
            created_at: data.created_at || m.created_at,
          };
        }
        return m;
      });

      return {
        messages: {
          ...state.messages,
          [data.conversation_id]: updatedList,
        },
      };
    });
  },

  handleNewMessage: (msgData) => {
    const convId = msgData.conversation_id;
    const currentUser = useAuthStore.getState().user;
    const isMine = currentUser ? msgData.sender_id === currentUser.id : false;

    const newMsg: Message = {
      id: msgData.id,
      conversation_id: convId,
      sender_id: msgData.sender_id,
      body: msgData.body,
      client_id: msgData.client_id,
      created_at: msgData.created_at,
      deleted_for_sender: false,
      deleted_for_all: false,
      is_mine: isMine,
      status: msgData.status || 'delivered',
    };

    set((state) => {
      const currentList = state.messages[convId] || [];
      // Prevent duplicates
      if (currentList.some((m) => m.id === newMsg.id || (m.client_id && m.client_id === newMsg.client_id))) {
        return state;
      }

      const isActive = state.activeConversationId === convId;
      const updatedList = [...currentList, newMsg];

      const updatedConversations = state.conversations.map((c) => {
        if (c.id === convId) {
          return {
            ...c,
            last_message: newMsg,
            last_message_at: newMsg.created_at,
            unread_count: isActive ? 0 : c.unread_count + 1,
          };
        }
        return c;
      });

      return {
        messages: {
          ...state.messages,
          [convId]: updatedList,
        },
        conversations: updatedConversations,
      };
    });

    // If viewing this conversation right now, mark as read immediately
    if (get().activeConversationId === convId) {
      get().markConversationAsRead(convId);
    }
  },

  handleMessageDelivered: (data) => {
    set((state) => {
      const list = state.messages[data.conversation_id] || [];
      const updatedList = list.map((m) => {
        if (m.id === data.message_id && m.status !== 'seen') {
          return { ...m, status: 'delivered' as const };
        }
        return m;
      });

      return {
        messages: {
          ...state.messages,
          [data.conversation_id]: updatedList,
        },
      };
    });
  },

  handleMessageSeen: (data) => {
    set((state) => {
      const list = state.messages[data.conversation_id] || [];
      const updatedList = list.map((m) => {
        if (m.is_mine && m.id <= data.last_read_message_id) {
          return { ...m, status: 'seen' as const };
        }
        return m;
      });

      return {
        messages: {
          ...state.messages,
          [data.conversation_id]: updatedList,
        },
      };
    });
  },

  handleMessageDeleted: (data) => {
    set((state) => {
      const list = state.messages[data.conversation_id] || [];
      const updatedList = list.map((m) => {
        if (m.id === data.message_id) {
          return { ...m, deleted_for_all: true, body: 'This message was unsent' };
        }
        return m;
      });

      return {
        messages: {
          ...state.messages,
          [data.conversation_id]: updatedList,
        },
      };
    });
  },

  handleTyping: (data) => {
    set((state) => {
      const currentSet = new Set(state.typingUsers[data.conversation_id] || []);
      if (data.is_typing) {
        currentSet.add(data.user_id);
      } else {
        currentSet.delete(data.user_id);
      }

      return {
        typingUsers: {
          ...state.typingUsers,
          [data.conversation_id]: currentSet,
        },
      };
    });
  },
}));

