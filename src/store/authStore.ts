import { create } from 'zustand';
import { User } from '@/types';
import { authApi } from '@/api/auth';
import { setAccessToken } from '@/api/client';
import { socketService } from '@/ws/socket';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initAuth: () => Promise<void>;
  login: (params: { username: string; password: string }) => Promise<void>;
  register: (params: { username: string; password: string; display_name?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initAuth: async () => {
    try {
      set({ isLoading: true });
      // Attempt silent token refresh via httpOnly cookie on boot
      const refreshRes = await authApi.refresh();
      set({
        user: refreshRes.user,
        isAuthenticated: true,
        isLoading: false,
      });
      socketService.connect();
    } catch {
      setAccessToken(null);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  login: async (params) => {
    const res = await authApi.login(params);
    set({
      user: res.user,
      isAuthenticated: true,
    });
    socketService.connect();
  },

  register: async (params) => {
    const res = await authApi.register(params);
    set({
      user: res.user,
      isAuthenticated: true,
    });
    socketService.connect();
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Continue cleanup regardless of server response
    } finally {
      socketService.disconnect();
      set({
        user: null,
        isAuthenticated: false,
      });
    }
  },

  updateUser: (partial) => {
    const current = get().user;
    if (current) {
      set({ user: { ...current, ...partial } });
    }
  },
}));

// Listen for global logout event triggered by apiClient on token refresh expiration
window.addEventListener('chatgram:logout', () => {
  useAuthStore.getState().logout();
});

